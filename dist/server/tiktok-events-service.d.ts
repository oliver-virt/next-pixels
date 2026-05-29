import type { FacebookEventData } from "../types.js";
/** True when the TikTok provider is configured (Pixel ID present). */
export declare function isTikTokConfigured(): boolean;
/**
 * Send an event to TikTok's Events API 2.0 (server-side).
 *
 * In development mode, logs the event and returns a mock response.
 * In production, hashes PII and POSTs to the Events API.
 *
 * Required env vars: `TIKTOK_ACCESS_TOKEN`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID`
 *
 * @see https://business-api.tiktok.com/portal/docs?id=1771101027431426
 */
export declare function sendTikTokServerEvent(eventData: FacebookEventData): Promise<any>;
//# sourceMappingURL=tiktok-events-service.d.ts.map