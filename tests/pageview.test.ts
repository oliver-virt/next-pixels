// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackPageView } from "../dist/client/fb-pixel-client.js";
import { trackTikTokPageView } from "../dist/client/tt-pixel-client.js";

beforeEach(() => {
  (window as any).fbq = vi.fn();
  (window as any).ttq = { track: vi.fn(), page: vi.fn() };
});

describe("per-provider PageView (used by <PixelPageView />)", () => {
  it("Meta fires fbq('track','PageView')", () => {
    trackPageView("/p", new URLSearchParams("a=1"));
    expect((window as any).fbq).toHaveBeenCalledWith("track", "PageView");
  });

  it("TikTok fires ttq.page()", () => {
    trackTikTokPageView();
    expect((window as any).ttq.page).toHaveBeenCalledTimes(1);
  });

  it("both no-op (no throw) when the pixel script is not loaded", () => {
    delete (window as any).fbq;
    delete (window as any).ttq;
    expect(() => trackPageView("/p", new URLSearchParams())).not.toThrow();
    expect(() => trackTikTokPageView()).not.toThrow();
  });
});
