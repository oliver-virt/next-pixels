"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import Script from "next/script";
import { FB_PIXEL_ID } from "./fb-pixel-client.js";
import { logPixelEvent, logPixelError, logPixelWarning } from "../utils/logger.js";
/**
 * Facebook Pixel script loader component.
 *
 * Add this to your root layout to initialize the pixel.
 * Uses `afterInteractive` strategy for optimal loading.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { FacebookPixel } from "next-pixels";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html><body>
 *       {children}
 *       <FacebookPixel />
 *     </body></html>
 *   );
 * }
 * ```
 */
export function FacebookPixel() {
    if (!FB_PIXEL_ID) {
        logPixelWarning("NEXT_PUBLIC_FB_PIXEL_ID is not set");
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx(Script, { id: "fb-pixel", strategy: "afterInteractive", onLoad: () => logPixelEvent("Script loaded successfully"), onError: (e) => logPixelError("Script failed to load", e), dangerouslySetInnerHTML: {
                    __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod ?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
                } }), _jsx("noscript", { children: _jsx("img", { height: "1", width: "1", style: { display: "none" }, src: `https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`, alt: "" }) })] }));
}
//# sourceMappingURL=FacebookPixel.js.map