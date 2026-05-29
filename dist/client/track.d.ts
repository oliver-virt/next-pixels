import type { TrackOptions } from "../types.js";
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
 * import { track } from "next-meta-pixel";
 *
 * // Fires Meta "Purchase" + TikTok "CompletePayment", deduped
 * track({
 *   eventName: "Purchase",
 *   data: { value: 29.99, currency: "USD" },
 *   emails: ["user@example.com"],
 * });
 * ```
 */
export declare function track(options: TrackOptions): void;
/** @deprecated Use {@link track}. Kept for backward compatibility (Meta-era name). */
export declare const fbEvent: typeof track;
//# sourceMappingURL=track.d.ts.map