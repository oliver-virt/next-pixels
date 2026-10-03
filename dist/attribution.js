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
export const ATTRIBUTION_COOKIE = "px_attr";
export const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days
/** Auth/redirect plumbing — never a real traffic source. */
const MASKING_REFERRER_HOSTS = new Set([
    "accounts.google.com",
    "appleid.apple.com",
    "www.facebook.com", // FB login dialog; feed traffic carries fbclid instead
]);
const UTM_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
];
const CLICK_ID_KEYS = ["ttclid", "fbclid", "gclid", "gbraid", "wbraid"];
/** Every field the cookie may hold, with its length cap. Anything else read back is dropped. */
const FIELD_LIMITS = {
    utm_source: 200,
    utm_medium: 200,
    utm_campaign: 200,
    utm_content: 200,
    utm_term: 200,
    ttclid: 500,
    fbclid: 500,
    gclid: 500,
    gbraid: 500,
    wbraid: 500,
    referrer_host: 253,
    landing_path: 200,
    ts: 40,
};
const withoutWww = (host) => host.replace(/^www\./, "");
/** Same site, www-insensitive, including parent/child subdomains. Sibling subdomains are not matched. */
function isOwnHost(referrerHost, currentHost) {
    const a = withoutWww(referrerHost);
    const b = withoutWww(currentHost);
    return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}
/**
 * True when the URL carries any param that can pin a first touch. Use in
 * proxy matchers that would otherwise skip cacheable routes — per-click URLs
 * bypass edge caches anyway.
 */
export function hasAttributionParams(url) {
    return (url.searchParams.has("utm_source") ||
        CLICK_ID_KEYS.some((k) => url.searchParams.has(k)));
}
/** Build the attribution payload for a first-seen request. */
export function buildAttribution(url, referrer, now = new Date()) {
    const attr = {};
    for (const key of UTM_KEYS) {
        const v = url.searchParams.get(key);
        if (v)
            attr[key] = v.slice(0, 200);
    }
    for (const key of CLICK_ID_KEYS) {
        const v = url.searchParams.get(key);
        if (v)
            attr[key] = v.slice(0, 500);
    }
    if (referrer) {
        try {
            const host = new URL(referrer).hostname;
            // Own host (internal nav) and auth plumbing are not origins.
            if (host && !isOwnHost(host, url.hostname) && !MASKING_REFERRER_HOSTS.has(host)) {
                attr.referrer_host = host;
            }
        }
        catch {
            // unparseable referrer — drop
        }
    }
    attr.landing_path = url.pathname.slice(0, 200);
    attr.ts = now.toISOString();
    return attr;
}
/** True when the request carried any signal worth pinning as first touch. */
export function hasAttributionSignal(attr) {
    return Boolean(attr.utm_source || CLICK_ID_KEYS.some((k) => attr[k]) || attr.referrer_host);
}
export function serializeAttribution(attr) {
    return encodeURIComponent(JSON.stringify(attr));
}
/**
 * The cookie is readable and writable by the browser, so a read keeps only
 * known fields holding non-empty strings, capped to their length.
 */
export function parseAttribution(raw) {
    if (!raw)
        return null;
    let parsed;
    try {
        parsed = JSON.parse(decodeURIComponent(raw));
    }
    catch {
        return null;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
        return null;
    const out = {};
    for (const [key, limit] of Object.entries(FIELD_LIMITS)) {
        const value = parsed[key];
        if (typeof value === "string" && value)
            out[key] = value.slice(0, limit);
    }
    return Object.keys(out).length > 0 ? out : null;
}
/** Read the pinned first touch off an incoming request, if any. */
export function readAttribution(request) {
    return parseAttribution(request.cookies.get(ATTRIBUTION_COOKIE)?.value);
}
/**
 * Analytics-ready properties, prefixed `first_touch_*` so they never collide
 * with provider-reserved names.
 */
export function attributionProperties(attr) {
    if (!attr)
        return {};
    const out = {};
    for (const [k, v] of Object.entries(attr)) {
        if (typeof v === "string" && v)
            out[`first_touch_${k}`] = v;
    }
    return out;
}
/**
 * Pin first-touch attribution from a proxy/middleware. The first tagged
 * touch (utm, click id or outside referrer) wins and is never overwritten.
 * Plain direct hits set nothing unless `captureDirect` is on; a direct
 * record is then replaced by the first tagged touch. A cookie that cannot be
 * read back counts as absent, so it never blocks the next real touch.
 *
 * @example
 * ```ts
 * // proxy.ts / middleware.ts
 * seedAttributionCookie(request, response);
 * return response;
 * ```
 */
export function seedAttributionCookie(request, response, options = {}) {
    const { now = new Date(), captureDirect = false } = options instanceof Date ? { now: options } : options;
    const existing = readAttribution(request);
    if (existing && hasAttributionSignal(existing))
        return;
    const attr = buildAttribution(request.nextUrl, request.headers.get("referer"), now);
    const tagged = hasAttributionSignal(attr);
    if (!tagged && (existing || !captureDirect))
        return;
    response.cookies.set(ATTRIBUTION_COOKIE, serializeAttribution(attr), {
        maxAge: ATTRIBUTION_MAX_AGE,
        path: "/",
        sameSite: "lax",
        httpOnly: false, // client analytics may read it too
        secure: true,
    });
}
//# sourceMappingURL=attribution.js.map