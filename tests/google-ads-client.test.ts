// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// GOOGLE_ADS_ID and the default label are read at module-load time, so each
// test sets env, resets modules, then dynamically imports a fresh copy.
async function loadGoogle(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import("../dist/client/google-ads-client.js");
}

let gtag: Mock;
beforeEach(() => {
  gtag = vi.fn();
  window.gtag = gtag;
});

const conversionCalls = () =>
  gtag.mock.calls.filter((c) => c[0] === "event" && c[1] === "conversion");
const setCalls = () =>
  gtag.mock.calls.filter((c) => c[0] === "set" && c[1] === "user_data");

describe("trackGoogleAdsConversion", () => {
  it("fires a conversion with send_to, transaction_id, value, currency", async () => {
    const g = await loadGoogle({ NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-123" });
    g.trackGoogleAdsConversion(
      "Purchase",
      { value: 29.99, currency: "USD" },
      "evt-1",
      "LabelABC"
    );

    expect(conversionCalls()).toHaveLength(1);
    expect(conversionCalls()[0][2]).toEqual({
      send_to: "AW-123/LabelABC",
      transaction_id: "evt-1",
      value: 29.99,
      currency: "USD",
    });
  });

  it("resolves the label: per-call > registered map > env default", async () => {
    const g = await loadGoogle({
      NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-123",
      NEXT_PUBLIC_GOOGLE_ADS_LABEL: "DefaultLbl",
    });

    // per-call wins
    g.trackGoogleAdsConversion("Purchase", {}, "e", "PerCall");
    expect(conversionCalls()[0][2].send_to).toBe("AW-123/PerCall");

    // map used when no per-call
    g.setGoogleConversionLabels({ Purchase: "MapLbl" });
    g.trackGoogleAdsConversion("Purchase", {}, "e");
    expect(conversionCalls()[1][2].send_to).toBe("AW-123/MapLbl");

    // env default when neither
    g.trackGoogleAdsConversion("SomethingElse", {}, "e");
    expect(conversionCalls()[2][2].send_to).toBe("AW-123/DefaultLbl");
  });

  it("sets Enhanced Conversions user_data before the conversion", async () => {
    const g = await loadGoogle({ NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-123" });
    g.trackGoogleAdsConversion("Purchase", {}, "e", "L", {
      email: "a@b.com",
      phone_number: "+15551234",
      address: { first_name: "John" },
    });

    expect(setCalls()).toHaveLength(1);
    expect(setCalls()[0][2]).toEqual({
      email: "a@b.com",
      phone_number: "+15551234",
      address: { first_name: "John" },
    });
    expect(conversionCalls()).toHaveLength(1);
  });

  it("no-ops (warns) when no label can be resolved", async () => {
    const g = await loadGoogle({ NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-123" });
    g.trackGoogleAdsConversion("Purchase", {}, "e"); // no per-call, no map, no default
    expect(conversionCalls()).toHaveLength(0);
  });

  it("no-ops (no throw) when gtag is not loaded", async () => {
    const g = await loadGoogle({ NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-123" });
    Reflect.deleteProperty(window, "gtag");
    expect(() =>
      g.trackGoogleAdsConversion("Purchase", {}, "e", "L")
    ).not.toThrow();
  });
});

describe("trackGoogleAdsPageView", () => {
  it("sends page_view to the Ads tag", async () => {
    const g = await loadGoogle({ NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-123" });
    g.trackGoogleAdsPageView();
    const pv = gtag.mock.calls.filter(
      (c) => c[0] === "event" && c[1] === "page_view"
    );
    expect(pv).toHaveLength(1);
    expect(pv[0][2]).toEqual({ send_to: "AW-123" });
  });
});

describe("track() integration", () => {
  it("fires a Google conversion alongside Meta/TikTok with the shared id", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_ID", "AW-999");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_LABEL", "Lbl");
    const fbq = vi.fn();
    window.fbq = fbq;
    Reflect.deleteProperty(window, "ttq"); // TikTok not loaded; fine
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({}) })));

    const { track } = await import("../dist/client/track.js");
    track({ eventName: "Purchase", data: { value: 5 }, emails: ["a@b.com"] });

    expect(conversionCalls()).toHaveLength(1);
    const sentId = conversionCalls()[0][2].transaction_id;
    const fbId = fbq.mock.calls.find((c) => c[0] === "track")?.[2].eventID;
    expect(sentId).toBeTruthy();
    expect(sentId).toBe(fbId); // same event id across providers
    // Enhanced Conversions user_data carried the email
    expect(setCalls()[0][2]).toMatchObject({ email: "a@b.com" });
  });
});
