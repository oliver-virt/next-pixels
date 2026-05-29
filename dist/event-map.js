/**
 * Maps Meta (Facebook) standard event names to their TikTok equivalents.
 *
 * Most names match across both platforms. Only the divergent ones are listed
 * here; anything not in the map is passed through unchanged. Custom event names
 * are passed through as-is on both platforms.
 *
 * @see https://ads.tiktok.com/help/article/standard-events-parameters
 */
export const META_TO_TIKTOK_EVENTS = {
    Purchase: "CompletePayment",
    Lead: "SubmitForm",
    AddToCart: "AddToCart",
    AddToWishlist: "AddToWishlist",
    InitiateCheckout: "InitiateCheckout",
    AddPaymentInfo: "AddPaymentInfo",
    ViewContent: "ViewContent",
    CompleteRegistration: "CompleteRegistration",
    Search: "Search",
    Subscribe: "Subscribe",
    Contact: "Contact",
};
/**
 * Resolve the TikTok event name for a given Meta event name.
 *
 * @param metaName  The event name passed to `track()` (Meta-style).
 * @param override  Optional explicit TikTok event name (`tiktokEventName`).
 */
export function toTikTokEventName(metaName, override) {
    return override ?? META_TO_TIKTOK_EVENTS[metaName] ?? metaName;
}
//# sourceMappingURL=event-map.js.map