"use client";

import { logPixelEvent, logPixelWarning } from "../utils/logger.js";

export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const DEFAULT_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL;

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
  address?: { first_name?: string; last_name?: string };
}

/**
 * Per-event conversion-label map. Google Ads needs a distinct label per
 * conversion action, so map your event names to their labels:
 *
 * ```ts
 * setGoogleConversionLabels({ Purchase: "AbC-D_efG", Lead: "XyZ-1_2345" });
 * ```
 */
let conversionLabels: Record<string, string> = {};

/** Register the eventName → Google Ads conversion-label map. */
export function setGoogleConversionLabels(map: Record<string, string>): void {
  conversionLabels = { ...map };
}

export function isGoogleAdsInitialized(): boolean {
  return typeof window !== "undefined" && typeof window.gtag !== "undefined";
}

/**
 * Resolve the gtag `send_to` value (`AW-XXXX/label`) for an event.
 * Precedence: explicit per-call label → registered map → env default label.
 * Returns null when no Ads ID or no label is available.
 */
function resolveSendTo(eventName: string, perCallLabel?: string): string | null {
  if (!GOOGLE_ADS_ID) return null;
  const label = perCallLabel ?? conversionLabels[eventName] ?? DEFAULT_LABEL;
  return label ? `${GOOGLE_ADS_ID}/${label}` : null;
}

/** Send a page_view to the Ads tag on route changes (powers remarketing audiences). */
export function trackGoogleAdsPageView(): void {
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
export function trackGoogleAdsConversion(
  eventName: string,
  options: Record<string, unknown> = {},
  eventId?: string,
  perCallLabel?: string,
  userData?: GoogleUserData
): void {
  if (!isGoogleAdsInitialized()) {
    logPixelWarning("gtag is not initialized", "client");
    return;
  }

  const sendTo = resolveSendTo(eventName, perCallLabel);
  if (!sendTo) {
    logPixelWarning(
      `No Google Ads conversion label for "${eventName}" (set one via setGoogleConversionLabels or NEXT_PUBLIC_GOOGLE_ADS_LABEL)`,
      "client"
    );
    return;
  }

  // Enhanced Conversions: attach user-provided data before the conversion.
  if (userData) {
    window.gtag("set", "user_data", userData);
  }

  const params: Record<string, unknown> = { send_to: sendTo };
  if (eventId) params.transaction_id = eventId;
  if (typeof options.value !== "undefined") params.value = options.value;
  if (options.currency) params.currency = options.currency;

  window.gtag("event", "conversion", params);
  logPixelEvent(`Google Ads conversion: ${eventName}`, { sendTo, eventId }, "client");
}
