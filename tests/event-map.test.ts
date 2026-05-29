import { describe, it, expect } from "vitest";
import {
  META_TO_TIKTOK_EVENTS,
  toTikTokEventName,
} from "../dist/event-map.js";

describe("toTikTokEventName", () => {
  it("maps divergent Meta names to TikTok equivalents", () => {
    expect(toTikTokEventName("Purchase")).toBe("CompletePayment");
    expect(toTikTokEventName("Lead")).toBe("SubmitForm");
  });

  it("passes through names that match on both platforms", () => {
    expect(toTikTokEventName("AddToCart")).toBe("AddToCart");
    expect(toTikTokEventName("ViewContent")).toBe("ViewContent");
  });

  it("passes through unknown/custom event names unchanged", () => {
    expect(toTikTokEventName("MyCustomEvent")).toBe("MyCustomEvent");
  });

  it("honors an explicit override above the map", () => {
    expect(toTikTokEventName("Lead", "ViewContent")).toBe("ViewContent");
    expect(toTikTokEventName("Purchase", "PlaceAnOrder")).toBe("PlaceAnOrder");
  });

  it("the published map contains the key conversions", () => {
    expect(META_TO_TIKTOK_EVENTS.Purchase).toBe("CompletePayment");
    expect(META_TO_TIKTOK_EVENTS.Lead).toBe("SubmitForm");
  });
});
