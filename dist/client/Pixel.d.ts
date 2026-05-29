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
export declare function Pixel(): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Pixel.d.ts.map