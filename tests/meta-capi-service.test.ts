import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMetaServerEvent } from "../dist/server/capi-service.js";
import { hashData, digitsOnly } from "../dist/utils/hash.js";

function mockFetch(response: unknown, ok = true) {
  const fn = vi.fn(async () => ({ ok, json: async () => response }));
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
  fbp: "fbp-val",
  fbc: "fbc-val",
  userAgent: "test-agent",
  sourceUrl: "https://shop.example.com/checkout",
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_FB_PIXEL_ID", "111222333");
  vi.stubEnv("FB_PIXEL_ACCESS_TOKEN", "EAA-token");
});

describe("sendMetaServerEvent — request payload", () => {
  it("posts to the Graph API events endpoint for the pixel", async () => {
    const fetchFn = mockFetch({ events_received: 1 });
    await sendMetaServerEvent(baseEvent as any);

    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://graph.facebook.com/v21.0/111222333/events");
    const body = JSON.parse(init.body as string);
    expect(body.access_token).toBe("EAA-token");
  });

  it("keeps the Meta event name unmapped and passes event_id + seconds", async () => {
    const fetchFn = mockFetch({ events_received: 1 });
    await sendMetaServerEvent(baseEvent as any);
    const ev = JSON.parse(
      (fetchFn.mock.calls[0][1] as RequestInit).body as string
    ).data[0];

    expect(ev.event_name).toBe("Purchase"); // NOT "CompletePayment"
    expect(ev.event_id).toBe("evt-123");
    expect(ev.action_source).toBe("website");
    expect(Number.isInteger(ev.event_time)).toBe(true);
    expect(ev.event_time).toBeLessThan(1e11);
  });

  it("hashes ALL emails (array) and the phone digits-only", async () => {
    const fetchFn = mockFetch({ events_received: 1 });
    await sendMetaServerEvent(baseEvent as any);
    const user = JSON.parse(
      (fetchFn.mock.calls[0][1] as RequestInit).body as string
    ).data[0].user_data;

    expect(user.em).toEqual([
      await hashData("First@Example.com"),
      await hashData("second@example.com"),
    ]);
    expect(user.ph).toEqual([await hashData(digitsOnly("+972 50-123 4567"))]);
    expect(user.fbp).toBe("fbp-val");
    expect(user.fbc).toBe("fbc-val");
  });

  it("maps products to custom_data.contents with id/quantity", async () => {
    const fetchFn = mockFetch({ events_received: 1 });
    await sendMetaServerEvent(baseEvent as any);
    const custom = JSON.parse(
      (fetchFn.mock.calls[0][1] as RequestInit).body as string
    ).data[0].custom_data;

    expect(custom.content_type).toBe("product");
    expect(custom.contents).toEqual([{ id: "SKU1", quantity: 2 }]);
    expect(custom.value).toBe(29.99);
    expect(custom.currency).toBe("USD");
    expect(custom.source_url).toBe("https://shop.example.com/checkout");
  });
});

describe("sendMetaServerEvent — validation & errors", () => {
  it("throws when no identifier is provided", async () => {
    mockFetch({ events_received: 1 });
    await expect(
      sendMetaServerEvent({ eventName: "Lead", eventId: "x" } as any)
    ).rejects.toThrow(/Insufficient customer data/);
  });

  it("throws on a non-ok HTTP response", async () => {
    mockFetch({ error: { message: "bad" } }, false);
    await expect(sendMetaServerEvent(baseEvent as any)).rejects.toThrow(
      /Facebook API error/
    );
  });
});
