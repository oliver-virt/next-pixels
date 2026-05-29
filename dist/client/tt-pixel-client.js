"use client";
import { logPixelEvent, logPixelWarning } from "../utils/logger.js";
import { toTikTokEventName } from "../event-map.js";
export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
export function isTikTokInitialized() {
    return typeof window !== "undefined" && typeof window.ttq !== "undefined";
}
/** Track a TikTok PageView (called automatically by PixelPageView on route changes) */
export function trackTikTokPageView() {
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
export function trackTikTokEvent(metaName, options = {}, eventId, ttNameOverride) {
    if (!isTikTokInitialized()) {
        logPixelWarning("ttq is not initialized", "client");
        return;
    }
    const name = toTikTokEventName(metaName, ttNameOverride);
    window.ttq.track(name, options, eventId ? { event_id: eventId } : undefined);
    logPixelEvent(`TikTok event: ${name}`, { eventId, ...options }, "client");
}
//# sourceMappingURL=tt-pixel-client.js.map