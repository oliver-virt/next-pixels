/** Get the Facebook Browser ID (_fbp) cookie */
export declare function getFbpCookie(): string | null;
/** Get the Facebook Click ID (_fbc) cookie */
export declare function getFbcCookie(): string | null;
/** Get the TikTok Pixel (_ttp) cookie */
export declare function getTtpCookie(): string | null;
/**
 * Get both _fbp and _fbc cookies.
 * In development, falls back to generated cookies if real ones aren't available.
 */
export declare function getFbCookies(): {
    fbp: string | null;
    fbc: string | null;
};
/**
 * Get all attribution cookies across providers: _fbp, _fbc (Meta) and _ttp (TikTok).
 * In development, Meta cookies fall back to generated values via {@link getFbCookies}.
 */
export declare function getMatchCookies(): {
    fbp: string | null;
    fbc: string | null;
    ttp: string | null;
};
//# sourceMappingURL=cookies.d.ts.map