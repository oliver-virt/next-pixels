/**
 * Tracks PageView events on every route change, across all configured providers.
 *
 * Add this alongside `<Pixel />` (or `<FacebookPixel />` / `<TikTokPixel />`) in
 * your layout. Wrapped in Suspense to avoid hydration issues with `useSearchParams`.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { FacebookPixel, PixelPageView } from "next-pixels";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html><body>
 *       {children}
 *       <FacebookPixel />
 *       <PixelPageView />
 *     </body></html>
 *   );
 * }
 * ```
 */
export declare function PixelPageView(): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=PixelPageView.d.ts.map