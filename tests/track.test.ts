// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { track } from "../dist/client/track.js";
import type { TikTokPixelApi } from "../dist/client/tt-pixel-client.js";

let fbq: Mock;
let ttqTrack: Mock;
let fetchMock: Mock;

function fullTtq(track: Mock): TikTokPixelApi {
  return {
    track,
    page: vi.fn(),
    identify: vi.fn(),
    instance: vi.fn(),
    load: vi.fn(),
  };
}

beforeEach(() => {
  fbq = vi.fn();
  ttqTrack = vi.fn();
  window.fbq = fbq;
  window.ttq = fullTtq(ttqTrack);
  fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
  vi.stubGlobal("fetch", fetchMock);
  document.cookie = "_fbp=fbp-val";
  document.cookie = "_fbc=fbc-val";
  document.cookie = "_ttp=ttp-val";
});

const fetchBody = () =>
  JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);

describe("track — shared event id (deduplication)", () => {
  it("sends the SAME id to fbq, ttq, and the server POST", () => {
    track({
      eventName: "Purchase",
      data: { value: 1, currency: "USD" },
      emails: ["a@b.com"],
    });

    expect(fbq.mock.calls).toHaveLength(1);
    expect(ttqTrack.mock.calls).toHaveLength(1);

    const fbId = fbq.mock.calls[0][2].eventID;
    const ttId = ttqTrack.mock.calls[0][2].event_id;
    const bodyId = fetchBody().eventId;

    expect(fbId).toBeTruthy();
    expect(fbId).toBe(ttId);
    expect(fbId).toBe(bodyId);
  });

  it("fires the TikTok pixel with the mapped event name", () => {
    track({ eventName: "Purchase", emails: ["a@b.com"] });
    expect(ttqTrack.mock.calls[0][0]).toBe("CompletePayment");
    expect(fbq.mock.calls[0][1]).toBe("Purchase"); // Meta keeps its own name
  });

  it("includes _fbp/_fbc/_ttp cookies in the server payload", () => {
    track({ eventName: "Lead" });
    const body = fetchBody();
    expect(body.fbp).toBe("fbp-val");
    expect(body.fbc).toBe("fbc-val");
    expect(body.ttp).toBe("ttp-val");
  });
});

describe("track — guards", () => {
  it("no-ops without eventName: no pixel, no network", () => {
    track({ eventName: "" });
    expect(fbq.mock.calls).toHaveLength(0);
    expect(ttqTrack.mock.calls).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not throw when the TikTok pixel is absent; Meta still fires", () => {
    Reflect.deleteProperty(window, "ttq");
    expect(() => track({ eventName: "Lead", emails: ["a@b.com"] })).not.toThrow();
    expect(fbq.mock.calls).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
