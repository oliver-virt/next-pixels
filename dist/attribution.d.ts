/**
 * First-touch attribution for Next.js apps.
 *
 * Client-side analytics only see what runs after cookie consent, and OAuth
 * redirects (Google/Apple/Facebook sign-in) rewrite the referrer — so the
 * visitor's true origin is routinely lost. This module pins it instead:
 *
 *   1. `seedAttributionCookie(request, response)` in your proxy/middleware
 *      stores utm tags, click ids (ttclid/fbclid/gclid), the real referrer
 *      host, and landing path in a first-party cookie on the visitor's first
 *      signal-bearing request — before consent, before any OAuth bounce.
 *   2. `eventsHandler` (next-pixels/handlers) reads the cookie automatically
 *      and backfills `ttclid`/`fbc` on server events, so Meta + TikTok can
 *      match conversions to ad clicks days after the click.
 *   3. `readAttribution(request)` + `attributionProperties()` let your own
 *      routes attach `first_touch_*` props to any analytics event.
 *
 * No PII is stored: utm values, click ids, referrer host, and path only.
 */
import type { NextRequest } from "next/server";
export declare const ATTRIBUTION_COOKIE = "px_attr";
export declare const ATTRIBUTION_MAX_AGE: number;
export interface Attribution {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    ttclid?: string;
    fbclid?: string;
    gclid?: string;
    referrer_host?: string;
    landing_path?: string;
    /** ISO timestamp of the first touch */
    ts?: string;
}
/**
 * True when the URL carries any param that can pin a first touch. Use in
 * proxy matchers that would otherwise skip cacheable routes — per-click URLs
 * bypass edge caches anyway.
 */
export declare function hasAttributionParams(url: URL): boolean;
/** Build the attribution payload for a first-seen request. */
export declare function buildAttribution(url: URL, referrer: string | null, now?: Date): Attribution;
/** True when the request carried any signal worth pinning as first touch. */
export declare function hasAttributionSignal(attr: Attribution): boolean;
export declare function serializeAttribution(attr: Attribution): string;
export declare function parseAttribution(raw: string | undefined): Attribution | null;
/** Read the pinned first touch off an incoming request, if any. */
export declare function readAttribution(request: {
    cookies: {
        get(name: string): {
            value: string;
        } | undefined;
    };
}): Attribution | null;
/**
 * Analytics-ready properties, prefixed `first_touch_*` so they never collide
 * with provider-reserved names.
 */
export declare function attributionProperties(attr: Attribution | null): Record<string, string>;
/** Minimal response shape — NextResponse satisfies it. */
interface CookieSettable {
    cookies: {
        set(name: string, value: string, options: {
            maxAge: number;
            path: string;
            sameSite: "lax";
            httpOnly: boolean;
            secure: boolean;
        }): unknown;
    };
}
/**
 * Pin first-touch attribution from a proxy/middleware. First touch wins —
 * an existing cookie is never overwritten; plain direct hits set nothing so
 * a later tagged visit can still claim the first touch.
 *
 * @example
 * ```ts
 * // proxy.ts / middleware.ts
 * seedAttributionCookie(request, response);
 * return response;
 * ```
 */
export declare function seedAttributionCookie(request: NextRequest, response: CookieSettable, now?: Date): void;
export {};
//# sourceMappingURL=attribution.d.ts.map