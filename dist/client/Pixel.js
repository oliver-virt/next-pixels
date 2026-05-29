"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { FacebookPixel } from "./FacebookPixel.js";
import { TikTokPixel } from "./TikTokPixel.js";
import { GoogleAds } from "./GoogleAds.js";
/**
 * Combined pixel loader — renders every configured provider's script.
 *
 * Each provider renders only if its env var is set
 * (`NEXT_PUBLIC_FB_PIXEL_ID` / `NEXT_PUBLIC_TIKTOK_PIXEL_ID`), so this is safe
 * to mount unconditionally. Pair it with `<PixelPageView />` for route-change
 * tracking.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { Pixel, PixelPageView } from "next-pixels";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html><body>
 *       {children}
 *       <Pixel />
 *       <PixelPageView />
 *     </body></html>
 *   );
 * }
 * ```
 */
export function Pixel() {
    return (_jsxs(_Fragment, { children: [_jsx(FacebookPixel, {}), _jsx(TikTokPixel, {}), _jsx(GoogleAds, {})] }));
}
//# sourceMappingURL=Pixel.js.map