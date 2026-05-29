"use client";
const isDevelopment = process.env.NODE_ENV === "development";
/** Get the Facebook Browser ID (_fbp) cookie */
export function getFbpCookie() {
    if (typeof document === "undefined")
        return null;
    const match = document.cookie.match(/_fbp=([^;]+)/);
    return match ? match[1] : null;
}
/** Get the Facebook Click ID (_fbc) cookie */
export function getFbcCookie() {
    if (typeof document === "undefined")
        return null;
    const match = document.cookie.match(/_fbc=([^;]+)/);
    return match ? match[1] : null;
}
/** Get the TikTok Pixel (_ttp) cookie */
export function getTtpCookie() {
    if (typeof document === "undefined")
        return null;
    const match = document.cookie.match(/_ttp=([^;]+)/);
    return match ? match[1] : null;
}
/** Generate a dev-only fallback _fbp cookie */
function generateDevFbpCookie() {
    return `fb.1.${Date.now()}.1234567890`;
}
/** Generate a dev-only fallback _fbc cookie */
function generateDevFbcCookie() {
    return `fb.1.${Date.now()}.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`;
}
/**
 * Get both _fbp and _fbc cookies.
 * In development, falls back to generated cookies if real ones aren't available.
 */
export function getFbCookies() {
    if (isDevelopment) {
        const realFbp = getFbpCookie();
        const realFbc = getFbcCookie();
        if (realFbp || realFbc) {
            return { fbp: realFbp, fbc: realFbc };
        }
        // Development fallback
        const fbp = generateDevFbpCookie();
        const fbc = generateDevFbcCookie();
        console.log("[next-meta-pixel] dev - Using fallback cookies:", {
            fbp,
            fbc,
        });
        return { fbp, fbc };
    }
    return {
        fbp: getFbpCookie(),
        fbc: getFbcCookie(),
    };
}
/**
 * Get all attribution cookies across providers: _fbp, _fbc (Meta) and _ttp (TikTok).
 * In development, Meta cookies fall back to generated values via {@link getFbCookies}.
 */
export function getMatchCookies() {
    const { fbp, fbc } = getFbCookies();
    return { fbp, fbc, ttp: getTtpCookie() };
}
//# sourceMappingURL=cookies.js.map