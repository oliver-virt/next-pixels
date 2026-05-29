"use client";

import Script from "next/script";
import { TIKTOK_PIXEL_ID } from "./tt-pixel-client.js";
import { logPixelEvent, logPixelError, logPixelWarning } from "../utils/logger.js";

/**
 * TikTok Pixel script loader component.
 *
 * Add this to your root layout (or use the combined `<Pixel />`) to initialize
 * the TikTok Pixel. Uses `afterInteractive` strategy for optimal loading.
 *
 * Requires `NEXT_PUBLIC_TIKTOK_PIXEL_ID`. Renders nothing if it is unset.
 *
 * @example
 * ```tsx
 * import { TikTokPixel } from "next-pixels";
 * // app/layout.tsx
 * <TikTokPixel />
 * ```
 */
export function TikTokPixel() {
  if (!TIKTOK_PIXEL_ID) {
    logPixelWarning("NEXT_PUBLIC_TIKTOK_PIXEL_ID is not set");
    return null;
  }

  return (
    <Script
      id="tiktok-pixel"
      strategy="afterInteractive"
      onLoad={() => logPixelEvent("TikTok script loaded successfully")}
      onError={(e) => logPixelError("TikTok script failed to load", e)}
      dangerouslySetInnerHTML={{
        __html: `
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
            ttq.load('${TIKTOK_PIXEL_ID}');
            ttq.page();
          }(window, document, 'ttq');
        `,
      }}
    />
  );
}
