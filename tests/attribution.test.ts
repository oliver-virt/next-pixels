import { describe, expect, it } from "vitest";
import {
  ATTRIBUTION_COOKIE,
  attributionProperties,
  buildAttribution,
  hasAttributionParams,
  hasAttributionSignal,
  parseAttribution,
  readAttribution,
  seedAttributionCookie,
  serializeAttribution,
} from "../src/attribution.js";

const NOW = new Date("2026-06-05T10:00:00Z");

describe("buildAttribution", () => {
  it("captures utm tags and click ids from the landing url", () => {
    const url = new URL("https://example.com/?utm_source=tiktok&utm_campaign=x&ttclid=abc");
    const attr = buildAttribution(url, null, NOW);
    expect(attr.utm_source).toBe("tiktok");
    expect(attr.utm_campaign).toBe("x");
    expect(attr.ttclid).toBe("abc");
    expect(attr.landing_path).toBe("/");
    expect(attr.ts).toBe("2026-06-05T10:00:00.000Z");
  });

  it("ignores OAuth plumbing referrers", () => {
    const attr = buildAttribution(
      new URL("https://example.com/page"),
      "https://accounts.google.com/o/oauth2",
      NOW
    );
    expect(attr.referrer_host).toBeUndefined();
  });

  it("keeps real external referrers, drops internal ones", () => {
    expect(
      buildAttribution(new URL("https://example.com/"), "https://www.google.com/s", NOW)
        .referrer_host
    ).toBe("www.google.com");
    expect(
      buildAttribution(new URL("https://example.com/a"), "https://example.com/", NOW)
        .referrer_host
    ).toBeUndefined();
  });
});

describe("hasAttributionParams / hasAttributionSignal", () => {
  it("params: utm_source + every click id, not unrelated params", () => {
    expect(hasAttributionParams(new URL("https://x.co/?utm_source=t"))).toBe(true);
    expect(hasAttributionParams(new URL("https://x.co/?ttclid=1"))).toBe(true);
    expect(hasAttributionParams(new URL("https://x.co/?fbclid=1"))).toBe(true);
    expect(hasAttributionParams(new URL("https://x.co/?gclid=1"))).toBe(true);
    expect(hasAttributionParams(new URL("https://x.co/?step=2"))).toBe(false);
  });

  it("signal: referrer counts, bare direct hit does not", () => {
    const bare = buildAttribution(new URL("https://x.co/"), null, NOW);
    expect(hasAttributionSignal(bare)).toBe(false);
    const ref = buildAttribution(new URL("https://x.co/"), "https://t.co/p", NOW);
    expect(hasAttributionSignal(ref)).toBe(true);
  });
});

describe("round-trip + analytics properties", () => {
  it("serialize/parse round-trips; properties are prefixed", () => {
    const attr = buildAttribution(new URL("https://x.co/?utm_source=dana"), null, NOW);
    const parsed = parseAttribution(serializeAttribution(attr));
    expect(parsed?.utm_source).toBe("dana");
    const props = attributionProperties(parsed);
    expect(props.first_touch_utm_source).toBe("dana");
    expect(props.first_touch_landing_path).toBe("/");
  });

  it("parse tolerates garbage and absence", () => {
    expect(parseAttribution(undefined)).toBeNull();
    expect(parseAttribution("%%%nope")).toBeNull();
  });
});

function fakeRequest(url: string, cookies: Record<string, string>, referer?: string) {
  return {
    nextUrl: new URL(url),
    headers: { get: (k: string) => (k === "referer" ? (referer ?? null) : null) },
    cookies: {
      get: (name: string) =>
        name in cookies ? { name, value: cookies[name] } : undefined,
    },
  };
}

function fakeResponse() {
  const set: Array<{ name: string; value: string; options: unknown }> = [];
  return {
    cookies: {
      set: (name: string, value: string, options: unknown) => {
        set.push({ name, value, options });
      },
    },
    written: set,
  };
}

describe("seedAttributionCookie", () => {
  it("sets the cookie on a signal-bearing first visit", () => {
    const req = fakeRequest("https://x.co/?utm_source=tiktok&ttclid=abc", {});
    const res = fakeResponse();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    seedAttributionCookie(req as any, res, NOW);
    expect(res.written).toHaveLength(1);
    expect(res.written[0].name).toBe(ATTRIBUTION_COOKIE);
    const attr = parseAttribution(res.written[0].value);
    expect(attr?.ttclid).toBe("abc");
  });

  it("never overwrites an existing cookie (first touch wins)", () => {
    const existing = serializeAttribution({ utm_source: "old" });
    const req = fakeRequest("https://x.co/?utm_source=new", {
      [ATTRIBUTION_COOKIE]: existing,
    });
    const res = fakeResponse();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    seedAttributionCookie(req as any, res, NOW);
    expect(res.written).toHaveLength(0);
  });

  it("sets nothing on a bare direct hit", () => {
    const req = fakeRequest("https://x.co/pricing", {});
    const res = fakeResponse();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    seedAttributionCookie(req as any, res, NOW);
    expect(res.written).toHaveLength(0);
  });
});

describe("readAttribution", () => {
  it("reads the pinned attribution off a request", () => {
    const req = fakeRequest("https://x.co/api/lead", {
      [ATTRIBUTION_COOKIE]: serializeAttribution({ ttclid: "tt-1", fbclid: "fb-1" }),
    });
    const attr = readAttribution(req);
    expect(attr?.ttclid).toBe("tt-1");
    expect(attr?.fbclid).toBe("fb-1");
  });
});
