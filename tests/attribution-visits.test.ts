import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/server/capi-service.js", () => ({
  sendServerEvent: vi.fn(async () => ({})),
}));

import {
  ATTRIBUTION_COOKIE,
  type SeedOptions,
  hasAttributionParams,
  readAttribution,
  seedAttributionCookie,
  serializeAttribution,
} from "../src/attribution.js";
import { eventsHandler } from "../src/handlers/events-handler.js";
import { sendServerEvent } from "../src/server/capi-service.js";

const NOW = new Date("2026-10-03T09:00:00Z");

/** One browser across several visits: sends the cookie it holds, keeps what the proxy sets. */
function browser() {
  let cookie: string | undefined;
  const request = (url: string, referer?: string) => {
    const headers = new Headers();
    if (referer) headers.set("referer", referer);
    if (cookie !== undefined) headers.set("cookie", `${ATTRIBUTION_COOKIE}=${cookie}`);
    return new NextRequest(url, { headers });
  };
  return {
    visit(url: string, referer?: string, options: SeedOptions = { now: NOW }) {
      const response = NextResponse.next();
      seedAttributionCookie(request(url, referer), response, options);
      const set = response.cookies.get(ATTRIBUTION_COOKIE);
      if (set) cookie = set.value;
      return Boolean(set);
    },
    firstTouch: (url = "https://hitkabalti.co.il/api/lead") => readAttribution(request(url)),
    request,
    setRawCookie(value: string) {
      cookie = value;
    },
  };
}

const rawJson = (value: unknown) => encodeURIComponent(JSON.stringify(value));

describe("a cookie the visitor edited or the browser broke", () => {
  it("keeps only known string fields, capped, when someone hand-edits px_attr", () => {
    const b = browser();
    b.setRawCookie(
      rawJson({
        utm_source: { $gt: "" },
        ttclid: 12345,
        gclid: "Cj0KCQ-real",
        landing_path: `/${"a".repeat(5000)}`,
        is_admin: "true",
      })
    );
    const attr = b.firstTouch();
    expect(attr).toEqual({ gclid: "Cj0KCQ-real", landing_path: `/${"a".repeat(199)}` });
  });

  it("reads an array or a bare string as no attribution", () => {
    const b = browser();
    b.setRawCookie(rawJson(["tiktok"]));
    expect(b.firstTouch()).toBeNull();
    b.setRawCookie(rawJson("tiktok"));
    expect(b.firstTouch()).toBeNull();
  });

  it("lets the next real touch replace a cookie cut short, instead of pinning nothing forever", () => {
    const b = browser();
    b.setRawCookie("%7B%22utm_source%22%3A%22tik");
    expect(b.visit("https://hitkabalti.co.il/?utm_source=tiktok")).toBe(true);
    expect(b.firstTouch()?.utm_source).toBe("tiktok");
  });

  it("reads a cookie written by 0.3 unchanged", () => {
    const v03 = {
      utm_source: "tiktok",
      utm_medium: "paid_social",
      ttclid: "E.C.P.abc",
      referrer_host: "www.tiktok.com",
      landing_path: "/degree-calculator",
      ts: "2026-09-01T10:00:00.000Z",
    };
    const b = browser();
    b.setRawCookie(serializeAttribution(v03));
    expect(b.firstTouch()).toEqual(v03);
  });

  it("never forwards a hand-edited click id to TikTok or Meta", async () => {
    const req = new NextRequest("https://hitkabalti.co.il/api/events", {
      method: "POST",
      body: JSON.stringify({ eventName: "Lead", eventId: "e1" }),
      headers: { cookie: `${ATTRIBUTION_COOKIE}=${rawJson({ ttclid: 12345, fbclid: ["x"] })}` },
    });
    await eventsHandler(req);
    const sent = vi.mocked(sendServerEvent).mock.calls[0][0];
    expect(sent.ttclid).toBeUndefined();
    expect(sent.fbc).toBeUndefined();
  });
});

describe("a Google ad clicked on an iPhone", () => {
  it.each(["gbraid", "wbraid"])("pins the first touch from %s when Google sends no gclid", (param) => {
    const url = `https://hitkabalti.co.il/degree-calculator?${param}=0AAAAADxyz&gad_source=1`;
    expect(hasAttributionParams(new URL(url))).toBe(true);
    const b = browser();
    expect(b.visit(url)).toBe(true);
    expect(b.firstTouch()).toMatchObject({ [param]: "0AAAAADxyz", landing_path: "/degree-calculator" });
  });
});

describe("moving around our own site", () => {
  it("does not record www → bare domain as a referral", () => {
    const b = browser();
    expect(b.visit("https://hitkabalti.co.il/amirnet", "https://www.hitkabalti.co.il/")).toBe(false);
    expect(b.firstTouch()).toBeNull();
  });

  it("does not record our own subdomain as a referral, either direction", () => {
    const b = browser();
    expect(b.visit("https://hitkabalti.co.il/", "https://school.hitkabalti.co.il/x")).toBe(false);
    expect(b.visit("https://school.hitkabalti.co.il/", "https://www.hitkabalti.co.il/")).toBe(false);
  });

  it("still records a lookalike domain as an outside referral", () => {
    const b = browser();
    expect(b.visit("https://hitkabalti.co.il/", "https://nothitkabalti.co.il/")).toBe(true);
    expect(b.firstTouch()?.referrer_host).toBe("nothitkabalti.co.il");
  });
});

describe("direct visits, e.g. a TikTok in-app browser that sends no referrer", () => {
  const direct: SeedOptions = { now: NOW, captureDirect: true };
  let b: ReturnType<typeof browser>;
  beforeEach(() => {
    b = browser();
  });

  it("records nothing unless the app opts in", () => {
    expect(b.visit("https://hitkabalti.co.il/amirnet")).toBe(false);
  });

  it("pins the landing page, lets a later tagged click take over, then holds", () => {
    b.visit("https://hitkabalti.co.il/amirnet", undefined, direct);
    expect(b.firstTouch()).toEqual({ landing_path: "/amirnet", ts: NOW.toISOString() });

    b.visit("https://hitkabalti.co.il/degree-calculator?utm_source=tiktok&ttclid=t1", undefined, direct);
    expect(b.firstTouch()).toMatchObject({ utm_source: "tiktok", ttclid: "t1", landing_path: "/degree-calculator" });

    b.visit("https://hitkabalti.co.il/", undefined, direct);
    b.visit("https://hitkabalti.co.il/?utm_source=instagram", undefined, direct);
    expect(b.firstTouch()?.utm_source).toBe("tiktok");
  });

  it("keeps the first landing page across later direct visits", () => {
    b.visit("https://hitkabalti.co.il/amirnet", undefined, direct);
    b.visit("https://hitkabalti.co.il/scholarships", undefined, direct);
    expect(b.firstTouch()?.landing_path).toBe("/amirnet");
  });
});
