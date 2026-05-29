import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendTikTokServerEvent } from "../dist/server/tiktok-events-service.js";
import { hashData, toE164 } from "../dist/utils/hash.js";

const TIKTOK_API_URL =
  "https://business-api.tiktok.com/open_api/v1.3/event/track/";

function mockFetch(response: unknown, ok = true) {
  const fn = vi.fn(async () => ({
    ok,
    json: async () => response,
  }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

const baseEvent = {
  eventName: "Purchase",
  eventId: "evt-123",
  emails: ["First@Example.com", "second@example.com"],
  phones: ["+972 50-123 4567"],
  products: [{ sku: "SKU1", quantity: 2 }],
  value: 29.99,
  currency: "USD",
  ttp: "ttp-cookie-value",
  userAgent: "test-agent",
  sourceUrl: "https://shop.example.com/checkout",
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_TIKTOK_PIXEL_ID", "PIXEL_ABC");
  vi.stubEnv("TIKTOK_ACCESS_TOKEN", "token-xyz");
});

describe("sendTikTokServerEvent — request payload", () => {
  it("posts a correctly-shaped Events API body", async () => {
    const fetchFn = mockFetch({ code: 0, message: "OK" });
    await sendTikTokServerEvent(baseEvent as any);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(TIKTOK_API_URL);
    expect((init.headers as Record<string, string>)["Access-Token"]).toBe(
      "token-xyz"
    );

    const body = JSON.parse(init.body as string);
    expect(body.event_source).toBe("web");
    expect(body.event_source_id).toBe("PIXEL_ABC");

    const ev = body.data[0];
    expect(ev.event).toBe("CompletePayment"); // mapped from "Purchase"
    expect(ev.event_id).toBe("evt-123"); // dedup hinge
  });

  it("uses event_time in SECONDS, not milliseconds", async () => {
    const fetchFn = mockFetch({ code: 0 });
    await sendTikTokServerEvent(baseEvent as any);
    const ev = JSON.parse(
      (fetchFn.mock.calls[0][1] as RequestInit).body as string
    ).data[0];

    expect(Number.isInteger(ev.event_time)).toBe(true);
    // seconds since epoch is ~1.7e9; milliseconds would be ~1.7e12.
    expect(ev.event_time).toBeLessThan(1e11);
  });

  it("hashes only the FIRST email, and the phone in E.164", async () => {
    const fetchFn = mockFetch({ code: 0 });
    await sendTikTokServerEvent(baseEvent as any);
    const user = JSON.parse(
      (fetchFn.mock.calls[0][1] as RequestInit).body as string
    ).data[0].user;

    expect(user.email).toBe(await hashData("First@Example.com"));
    expect(user.phone).toBe(await hashData(toE164("+972 50-123 4567")));
  });

  it("passes ttp and user_agent UNHASHED", async () => {
    const fetchFn = mockFetch({ code: 0 });
    await sendTikTokServerEvent(baseEvent as any);
    const user = JSON.parse(
      (fetchFn.mock.calls[0][1] as RequestInit).body as string
    ).data[0].user;

    expect(user.ttp).toBe("ttp-cookie-value");
    expect(user.user_agent).toBe("test-agent");
  });

  it("maps products to contents and carries value/currency + page.url", async () => {
    const fetchFn = mockFetch({ code: 0 });
    await sendTikTokServerEvent(baseEvent as any);
    const ev = JSON.parse(
      (fetchFn.mock.calls[0][1] as RequestInit).body as string
    ).data[0];

    expect(ev.properties.content_type).toBe("product");
    expect(ev.properties.contents).toEqual([{ content_id: "SKU1", quantity: 2 }]);
    expect(ev.properties.value).toBe(29.99);
    expect(ev.properties.currency).toBe("USD");
    expect(ev.page.url).toBe("https://shop.example.com/checkout");
  });
});

describe("sendTikTokServerEvent — error handling", () => {
  it("throws on HTTP 200 with a non-zero code (TikTok's logical error signal)", async () => {
    mockFetch({ code: 40000, message: "Invalid params" }, true);
    await expect(sendTikTokServerEvent(baseEvent as any)).rejects.toThrow(
      /TikTok API error/
    );
  });

  it("resolves on code 0", async () => {
    mockFetch({ code: 0, message: "OK", request_id: "r1" });
    await expect(sendTikTokServerEvent(baseEvent as any)).resolves.toMatchObject(
      { code: 0 }
    );
  });

  it("throws when access token is missing", async () => {
    vi.stubEnv("TIKTOK_ACCESS_TOKEN", "");
    mockFetch({ code: 0 });
    await expect(sendTikTokServerEvent(baseEvent as any)).rejects.toThrow(
      /Missing TIKTOK_ACCESS_TOKEN/
    );
  });
});

describe("sendTikTokServerEvent — dev mode", () => {
  it("returns a mock and does NOT hit the network when NODE_ENV=development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules(); // re-evaluate the load-time isDevelopment flag
    const fetchFn = mockFetch({ code: 0 });

    const mod = await import("../dist/server/tiktok-events-service.js");
    const res = await mod.sendTikTokServerEvent(baseEvent as any);

    expect(fetchFn).not.toHaveBeenCalled();
    expect(res).toMatchObject({ code: 0 });
  });
});
