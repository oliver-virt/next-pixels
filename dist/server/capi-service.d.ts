import type { FacebookEventData } from "../types.js";
/** True when the Meta provider is configured (Pixel ID present). */
export declare function isMetaConfigured(): boolean;
/**
 * Send an event to Facebook's Conversions API (server-side).
 *
 * In development mode, logs the event and returns a mock response.
 * In production, validates data, hashes PII, and sends to Graph API.
 *
 * Required env vars: `FB_PIXEL_ACCESS_TOKEN`, `NEXT_PUBLIC_FB_PIXEL_ID`
 */
export declare function sendMetaServerEvent(eventData: FacebookEventData): Promise<any>;
/** Per-provider result of a unified {@link sendServerEvent} call. */
export interface ServerEventResult {
    meta?: {
        ok: boolean;
        result?: unknown;
        error?: string;
    };
    tiktok?: {
        ok: boolean;
        result?: unknown;
        error?: string;
    };
}
/**
 * Send an event to every configured provider's server API (Meta CAPI +
 * TikTok Events API). A provider runs when its public pixel-id env var is set;
 * if none is set, Meta is assumed for backward compatibility.
 *
 * Failures are isolated per provider — one provider erroring does not prevent
 * the other from sending. The returned object reports each provider's outcome.
 */
export declare function sendServerEvent(eventData: FacebookEventData): Promise<ServerEventResult>;
//# sourceMappingURL=capi-service.d.ts.map