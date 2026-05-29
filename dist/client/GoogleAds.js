"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import Script from "next/script";
import { GOOGLE_ADS_ID } from "./google-ads-client.js";
import { logPixelEvent, logPixelError, logPixelWarning } from "../utils/logger.js";
/**
 * Google Ads (gtag.js) script loader component.
 *
 * Add this to your root layout (or use the combined `<Pixel />`) to load the
 * Google Ads tag. Fire conversions with `track()` / `trackGoogleAdsConversion`.
 *
 * Requires `NEXT_PUBLIC_GOOGLE_ADS_ID` (e.g. `AW-123456789`). Renders nothing
 * if it is unset.
 *
 * @example
 * ```tsx
 * import { GoogleAds } from "next-pixels";
 * // app/layout.tsx
 * <GoogleAds />
 * ```
 */
export function GoogleAds() {
    if (!GOOGLE_ADS_ID) {
        logPixelWarning("NEXT_PUBLIC_GOOGLE_ADS_ID is not set");
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx(Script, { id: "google-ads-lib", strategy: "afterInteractive", src: `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`, onLoad: () => logPixelEvent("Google Ads script loaded successfully"), onError: (e) => logPixelError("Google Ads script failed to load", e) }), _jsx(Script, { id: "google-ads-init", strategy: "afterInteractive", dangerouslySetInnerHTML: {
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');
          `,
                } })] }));
}
//# sourceMappingURL=GoogleAds.js.map