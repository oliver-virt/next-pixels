// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { track } from "../dist/client/track.js";

function setCookie(kv: string) {
  document.cookie = kv;
}

beforeEach(() => {
  (window as any).fbq = vi.fn();
  (window as any).ttq = { track: vi.fn(), page: vi.fn() };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => ({}) }))
  );
  setCookie("_fbp=fbp-val");
  setCookie("_fbc=fbc-val");
  setCookie("_ttp=ttp-val");
});

const fbqCalls = () => ((window as any).fbq as ReturnType<typeof vi.fn>).mock.calls;
const ttqCalls = () =>
  ((window as any).ttq.track as ReturnType<typeof vi.fn>).mock.calls;
const fetchBody = () => {
  const f = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
  return JSON.parse((f.mock.calls[0][1] as RequestInit).body as string);
};

describe("track — shared event id (deduplication)", () => {
  it("sends the SAME id to fbq, ttq, and the server POST", () => {
    track({
      eventName: "Purchase",
      data: { value: 1, currency: "USD" },
      emails: ["a@b.com"],
    });

    expect(fbqCalls()).toHaveLength(1);
    expect(ttqCalls()).toHaveLength(1);

    const fbId = fbqCalls()[0][2].eventID;
    const ttId = ttqCalls()[0][2].event_id;
    const bodyId = fetchBody().eventId;

    expect(fbId).toBeTruthy();
    expect(fbId).toBe(ttId);
    expect(fbId).toBe(bodyId);
  });

  it("fires the TikTok pixel with the mapped event name", () => {
    track({ eventName: "Purchase", emails: ["a@b.com"] });
    expect(ttqCalls()[0][0]).toBe("CompletePayment");
    expect(fbqCalls()[0][1]).toBe("Purchase"); // Meta keeps its own name
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
    track({ eventName: "" } as any);
    const f = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fbqCalls()).toHaveLength(0);
    expect(ttqCalls()).toHaveLength(0);
    expect(f).not.toHaveBeenCalled();
  });

  it("does not throw when the TikTok pixel is absent; Meta still fires", () => {
    delete (window as any).ttq;
    expect(() => track({ eventName: "Lead", emails: ["a@b.com"] })).not.toThrow();
    expect(fbqCalls()).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
