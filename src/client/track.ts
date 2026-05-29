"use client";

import type { FacebookEventData, TrackOptions } from "../types.js";
import { getMatchCookies } from "../utils/cookies.js";
import { generateUUID } from "../utils/uuid.js";
import { logPixelEvent, logPixelError } from "../utils/logger.js";
import { trackStandardEvent } from "./fb-pixel-client.js";
import { trackTikTokEvent } from "./tt-pixel-client.js";
import {
  trackGoogleAdsConversion,
  type GoogleUserData,
} from "./google-ads-client.js";

const DEFAULT_API_ROUTE = "/api/events";

/**
 * Track an event across every configured provider — client and server.
 *
 * For each enabled provider it:
 * - Fires the client pixel (`fbq('track', ...)` / `ttq.track(...)`)
 * - Forwards to the server route for the Conversions / Events API
 * - Shares one `eventId` so the platforms deduplicate client vs. server hits
 *
 * Providers with no pixel script loaded silently no-op on the client; the
 * server forwards only to providers whose env vars are configured.
 *
 * @example
 * ```tsx
 * import { track } from "next-pixels";
 *
 * // Fires Meta "Purchase" + TikTok "CompletePayment", deduped
 * track({
 *   eventName: "Purchase",
 *   data: { value: 29.99, currency: "USD" },
 *   emails: ["user@example.com"],
 * });
 * ```
 */
export function track(options: TrackOptions): void {
  const {
    eventName,
    data = {},
    emails,
    phones,
    firstName,
    lastName,
    tiktokEventName,
    googleLabel,
    apiRoute = DEFAULT_API_ROUTE,
  } = options;

  if (!eventName) {
    logPixelError("track called without eventName", undefined, "client");
    return;
  }

  const eventId = generateUUID();
  const { fbp, fbc, ttp } = getMatchCookies();

  // Build the full event data shared by all providers (client + server)
  const eventData: FacebookEventData = {
    eventName,
    eventId,
    userAgent:
      typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
    ...data,
    ...(emails && { emails }),
    ...(phones && { phones }),
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(tiktokEventName && { tiktokEventName }),
    ...(fbp && { fbp }),
    ...(fbc && { fbc }),
    ...(ttp && { ttp }),
  };

  // 1. Client-side: fire each provider's pixel (no-ops if not loaded)
  try {
    trackStandardEvent(eventName, data, eventId);
  } catch (error) {
    logPixelError(`Failed Meta client tracking: ${eventName}`, error, "client");
  }
  try {
    trackTikTokEvent(eventName, data, eventId, tiktokEventName);
  } catch (error) {
    logPixelError(`Failed TikTok client tracking: ${eventName}`, error, "client");
  }
  try {
    // Google Ads is client-only (Enhanced Conversions); no server forwarding.
    const userData = buildGoogleUserData(emails, phones, firstName, lastName);
    trackGoogleAdsConversion(eventName, data, eventId, googleLabel, userData);
  } catch (error) {
    logPixelError(`Failed Google client tracking: ${eventName}`, error, "client");
  }
  logPixelEvent(`Tracked: ${eventName}`, { eventId }, "client");

  // 2. Server-side: fire-and-forget POST to the unified events route
  fetch(apiRoute, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  })
    .then((res) => {
      if (!res.ok) {
        logPixelError(`Events route returned ${res.status}`, undefined, "server");
      } else {
        logPixelEvent(`Server event sent: ${eventName}`, { eventId }, "server");
      }
    })
    .catch((error) => {
      logPixelError(`Server event request failed: ${eventName}`, error, "server");
    });
}

/** Build Google Enhanced Conversions data from the call's PII (undefined if none). */
function buildGoogleUserData(
  emails?: string[],
  phones?: string[],
  firstName?: string,
  lastName?: string
): GoogleUserData | undefined {
  const userData: GoogleUserData = {};
  if (emails?.length) userData.email = emails[0];
  if (phones?.length) userData.phone_number = phones[0];
  if (firstName || lastName) {
    userData.address = {
      ...(firstName && { first_name: firstName }),
      ...(lastName && { last_name: lastName }),
    };
  }
  return Object.keys(userData).length ? userData : undefined;
}

/** @deprecated Use {@link track}. Kept for backward compatibility (Meta-era name). */
export const fbEvent = track;
