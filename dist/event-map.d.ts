/**
 * Maps Meta (Facebook) standard event names to their TikTok equivalents.
 *
 * Most names match across both platforms. Only the divergent ones are listed
 * here; anything not in the map is passed through unchanged. Custom event names
 * are passed through as-is on both platforms.
 *
 * @see https://ads.tiktok.com/help/article/standard-events-parameters
 */
export declare const META_TO_TIKTOK_EVENTS: Record<string, string>;
/**
 * Resolve the TikTok event name for a given Meta event name.
 *
 * @param metaName  The event name passed to `track()` (Meta-style).
 * @param override  Optional explicit TikTok event name (`tiktokEventName`).
 */
export declare function toTikTokEventName(metaName: string, override?: string): string;
//# sourceMappingURL=event-map.d.ts.map