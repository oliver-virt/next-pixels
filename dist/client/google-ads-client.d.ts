export declare const GOOGLE_ADS_ID: string | undefined;
declare global {
    interface Window {
        gtag: (...args: unknown[]) => void;
        dataLayer: unknown[];
    }
}
/** User-provided data for Google Enhanced Conversions (gtag hashes it client-side). */
export interface GoogleUserData {
    email?: string;
    phone_number?: string;
    address?: {
        first_name?: string;
        last_name?: string;
    };
}
/** Register the eventName → Google Ads conversion-label map. */
export declare function setGoogleConversionLabels(map: Record<string, string>): void;
export declare function isGoogleAdsInitialized(): boolean;
/** Send a page_view to the Ads tag on route changes (powers remarketing audiences). */
export declare function trackGoogleAdsPageView(): void;
/**
 * Fire a Google Ads conversion via gtag, with optional Enhanced Conversions data.
 *
 * @param eventName    track() event name (used to look up the conversion label).
 * @param options      Event data (value, currency).
 * @param eventId      Shared id, sent as `transaction_id` for Google's own dedup.
 * @param perCallLabel Explicit conversion label, overriding the map/default.
 * @param userData     Enhanced Conversions data (email/phone/name); gtag hashes it.
 */
export declare function trackGoogleAdsConversion(eventName: string, options?: Record<string, unknown>, eventId?: string, perCallLabel?: string, userData?: GoogleUserData): void;
//# sourceMappingURL=google-ads-client.d.ts.map