// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { trackPageView } from "../dist/client/fb-pixel-client.js";
import {
  trackTikTokPageView,
  type TikTokPixelApi,
} from "../dist/client/tt-pixel-client.js";

let ttqPage: Mock;

beforeEach(() => {
  window.fbq = vi.fn();
  ttqPage = vi.fn();
  const ttq: TikTokPixelApi = {
    track: vi.fn(),
    page: ttqPage,
    identify: vi.fn(),
    instance: vi.fn(),
    load: vi.fn(),
  };
  window.ttq = ttq;
});

describe("per-provider PageView (used by <PixelPageView />)", () => {
  it("Meta fires fbq('track','PageView')", () => {
    trackPageView("/p", new URLSearchParams("a=1"));
    expect(window.fbq).toHaveBeenCalledWith("track", "PageView");
  });

  it("TikTok fires ttq.page()", () => {
    trackTikTokPageView();
    expect(ttqPage).toHaveBeenCalledTimes(1);
  });

  it("both no-op (no throw) when the pixel script is not loaded", () => {
    Reflect.deleteProperty(window, "fbq");
    Reflect.deleteProperty(window, "ttq");
    expect(() => trackPageView("/p", new URLSearchParams())).not.toThrow();
    expect(() => trackTikTokPageView()).not.toThrow();
  });
});
