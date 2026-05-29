import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendServerEvent } from "../dist/server/capi-service.js";
import type { FacebookEventData } from "../dist/types.js";

const META_URL = "graph.facebook.com";
const TIKTOK_URL = "business-api.tiktok.com";

/** Mock fetch that branches by URL; metaOk toggles a Graph API failure. */
function mockFetch({ metaOk = true } = {}) {
  const fn = vi.fn(async (url: string) => {
    if (url.includes(META_URL)) {
      return { ok: metaOk, json: async () => ({ events_received: 1 }) };
    }
    if (url.includes(TIKTOK_URL)) {
      return { ok: true, json: async () => ({ code: 0 }) };
    }
    throw new Error(`unexpected url: ${url}`);
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const calledWith = (fn: ReturnType<typeof mockFetch>, frag: string) =>
  fn.mock.calls.some(([url]) => String(url).includes(frag));

// Identifier required so Meta validation reaches the fetch.
const event: FacebookEventData = {
  eventName: "Purchase",
  eventId: "evt-1",
  emails: ["user@example.com"],
};

function configureMeta() {
  vi.stubEnv("NEXT_PUBLIC_FB_PIXEL_ID", "111");
  vi.stubEnv("FB_PIXEL_ACCESS_TOKEN", "tok");
}
function configureTikTok() {
  vi.stubEnv("NEXT_PUBLIC_TIKTOK_PIXEL_ID", "PIX");
  vi.stubEnv("TIKTOK_ACCESS_TOKEN", "tok");
}

beforeEach(() => {
  // Start each test with no provider configured; tests opt in.
  vi.stubEnv("NEXT_PUBLIC_FB_PIXEL_ID", "");
  vi.stubEnv("FB_PIXEL_ACCESS_TOKEN", "");
  vi.stubEnv("NEXT_PUBLIC_TIKTOK_PIXEL_ID", "");
  vi.stubEnv("TIKTOK_ACCESS_TOKEN", "");
});

describe("sendServerEvent — provider gating", () => {
  it("both configured → both providers called and succeed", async () => {
    configureMeta();
    configureTikTok();
    const fetchFn = mockFetch();

    const res = await sendServerEvent(event);

    expect(calledWith(fetchFn, META_URL)).toBe(true);
    expect(calledWith(fetchFn, TIKTOK_URL)).toBe(true);
    expect(res.meta?.ok).toBe(true);
    expect(res.tiktok?.ok).toBe(true);
  });

  it("only Meta configured → TikTok is not called", async () => {
    configureMeta();
    const fetchFn = mockFetch();

    const res = await sendServerEvent(event);

    expect(calledWith(fetchFn, META_URL)).toBe(true);
    expect(calledWith(fetchFn, TIKTOK_URL)).toBe(false);
    expect(res.meta?.ok).toBe(true);
    expect(res.tiktok).toBeUndefined();
  });

  it("only TikTok configured → Meta is not called", async () => {
    configureTikTok();
    const fetchFn = mockFetch();

    const res = await sendServerEvent(event);

    expect(calledWith(fetchFn, TIKTOK_URL)).toBe(true);
    expect(calledWith(fetchFn, META_URL)).toBe(false);
    expect(res.tiktok?.ok).toBe(true);
    expect(res.meta).toBeUndefined();
  });

  it("nothing configured → defaults to attempting Meta (backward compat)", async () => {
    const fetchFn = mockFetch();

    const res = await sendServerEvent(event);

    // Meta has no token → it throws before the network call.
    expect(fetchFn).not.toHaveBeenCalled();
    expect(res.meta?.ok).toBe(false);
    expect(res.meta?.error).toMatch(/Missing FB_PIXEL_ACCESS_TOKEN/);
    expect(res.tiktok).toBeUndefined();
  });
});

describe("sendServerEvent — failure isolation", () => {
  it("one provider failing does not reject or block the other", async () => {
    configureMeta();
    configureTikTok();
    const fetchFn = mockFetch({ metaOk: false }); // Graph API returns error

    const res = await sendServerEvent(event); // must not throw

    expect(calledWith(fetchFn, META_URL)).toBe(true);
    expect(calledWith(fetchFn, TIKTOK_URL)).toBe(true);
    expect(res.meta?.ok).toBe(false);
    expect(res.meta?.error).toMatch(/Facebook API error/);
    expect(res.tiktok?.ok).toBe(true);
  });
});
