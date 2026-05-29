"use client";
import { logPixelEvent, logPixelWarning } from "../utils/logger.js";
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const DEFAULT_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL;
/**
 * Per-event conversion-label map. Google Ads needs a distinct label per
 * conversion action, so map your event names to their labels:
 *
 * ```ts
 * setGoogleConversionLabels({ Purchase: "AbC-D_efG", Lead: "XyZ-1_2345" });
 * ```
 */
let conversionLabels = {};
/** Register the eventName → Google Ads conversion-label map. */
export function setGoogleConversionLabels(map) {
    conversionLabels = { ...map };
}
export function isGoogleAdsInitialized() {
    return typeof window !== "undefined" && typeof window.gtag !== "undefined";
}
/**
 * Resolve the gtag `send_to` value (`AW-XXXX/label`) for an event.
 * Precedence: explicit per-call label → registered map → env default label.
 * Returns null when no Ads ID or no label is available.
 */
function resolveSendTo(eventName, perCallLabel) {
    if (!GOOGLE_ADS_ID)
        return null;
    const label = perCallLabel ?? conversionLabels[eventName] ?? DEFAULT_LABEL;
    return label ? `${GOOGLE_ADS_ID}/${label}` : null;
}
/** Send a page_view to the Ads tag on route changes (powers remarketing audiences). */
export function trackGoogleAdsPageView() {
    if (!isGoogleAdsInitialized() || !GOOGLE_ADS_ID) {
        return;
    }
    window.gtag("event", "page_view", { send_to: GOOGLE_ADS_ID });
    logPixelEvent("Google Ads page_view", undefined, "client");
}
/**
 * Fire a Google Ads conversion via gtag, with optional Enhanced Conversions data.
 *
 * @param eventName    track() event name (used to look up the conversion label).
 * @param options      Event data (value, currency).
 * @param eventId      Shared id, sent as `transaction_id` for Google's own dedup.
 * @param perCallLabel Explicit conversion label, overriding the map/default.
 * @param userData     Enhanced Conversions data (email/phone/name); gtag hashes it.
 */
export function trackGoogleAdsConversion(eventName, options = {}, eventId, perCallLabel, userData) {
    if (!isGoogleAdsInitialized()) {
        logPixelWarning("gtag is not initialized", "client");
        return;
    }
    const sendTo = resolveSendTo(eventName, perCallLabel);
    if (!sendTo) {
        logPixelWarning(`No Google Ads conversion label for "${eventName}" (set one via setGoogleConversionLabels or NEXT_PUBLIC_GOOGLE_ADS_LABEL)`, "client");
        return;
    }
    // Enhanced Conversions: attach user-provided data before the conversion.
    if (userData) {
        window.gtag("set", "user_data", userData);
    }
    const params = { send_to: sendTo };
    if (eventId)
        params.transaction_id = eventId;
    if (typeof options.value !== "undefined")
        params.value = options.value;
    if (options.currency)
        params.currency = options.currency;
    window.gtag("event", "conversion", params);
    logPixelEvent(`Google Ads conversion: ${eventName}`, { sendTo, eventId }, "client");
}
//# sourceMappingURL=google-ads-client.js.map