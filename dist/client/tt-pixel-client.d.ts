export declare const TIKTOK_PIXEL_ID: string | undefined;
declare global {
    interface Window {
        ttq: any;
        TiktokAnalyticsObject: any;
    }
}
export declare function isTikTokInitialized(): boolean;
/** Track a TikTok PageView (called automatically by PixelPageView on route changes) */
export declare function trackTikTokPageView(): void;
/**
 * Track a TikTok event.
 *
 * @param metaName     Meta-style event name (mapped to TikTok automatically).
 * @param options      Event properties (value, currency, contents, etc.).
 * @param eventId      Shared deduplication id (matched against the Events API).
 * @param ttNameOverride Explicit TikTok event name, bypassing the name map.
 */
export declare function trackTikTokEvent(metaName: string, options?: Record<string, unknown>, eventId?: string, ttNameOverride?: string): void;
//# sourceMappingURL=tt-pixel-client.d.ts.map