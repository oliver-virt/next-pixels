export declare const TIKTOK_PIXEL_ID: string | undefined;
/** Subset of the TikTok Pixel (`ttq`) runtime API used by this package. */
export interface TikTokPixelApi {
    page: () => void;
    track: (event: string, properties?: Record<string, unknown>, options?: {
        event_id?: string;
    }) => void;
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