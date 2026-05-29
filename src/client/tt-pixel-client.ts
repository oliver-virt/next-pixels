"use client";

import { logPixelEvent, logPixelWarning } from "../utils/logger.js";
import { toTikTokEventName } from "../event-map.js";

export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

/** Subset of the TikTok Pixel (`ttq`) runtime API used by this package. */
export interface TikTokPixelApi {
  page: () => void;
  track: (
    event: string,
    properties?: Record<string, unknown>,
    options?: { event_id?: string }
  ) => void;
  identify: (data: Record<string, unknown>) => void;
  instance: (id: string) => TikTokPixelApi;
  load: (id: string, options?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    ttq: TikTokPixelApi;
    TiktokAnalyticsObject: string;
  }
}

export function isTikTokInitialized(): boolean {
  return typeof window !== "undefined" && typeof window.ttq !== "undefined";
}

/** Track a TikTok PageView (called automatically by PixelPageView on route changes) */
export function trackTikTokPageView(): void {
  if (!isTikTokInitialized()) {
    logPixelWarning("ttq is not initialized", "client");
    return;
  }

  window.ttq.page();
  logPixelEvent("TikTok PageView", undefined, "client");
}

/**
 * Track a TikTok event.
 *
 * @param metaName     Meta-style event name (mapped to TikTok automatically).
 * @param options      Event properties (value, currency, contents, etc.).
 * @param eventId      Shared deduplication id (matched against the Events API).
 * @param ttNameOverride Explicit TikTok event name, bypassing the name map.
 */
export function trackTikTokEvent(
  metaName: string,
  options: Record<string, unknown> = {},
  eventId?: string,
  ttNameOverride?: string
): void {
  if (!isTikTokInitialized()) {
    logPixelWarning("ttq is not initialized", "client");
    return;
  }

  const name = toTikTokEventName(metaName, ttNameOverride);
  window.ttq.track(name, options, eventId ? { event_id: eventId } : undefined);
  logPixelEvent(`TikTok event: ${name}`, { eventId, ...options }, "client");
}
