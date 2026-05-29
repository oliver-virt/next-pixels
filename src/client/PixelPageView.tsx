"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { trackPageView } from "./fb-pixel-client.js";
import { trackTikTokPageView } from "./tt-pixel-client.js";
import { trackGoogleAdsPageView } from "./google-ads-client.js";

function PixelPageViewContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackPageView(pathname, searchParams);
    trackTikTokPageView();
    trackGoogleAdsPageView();
  }, [pathname, searchParams]);

  return null;
}

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
export function PixelPageView() {
  return (
    <Suspense fallback={null}>
      <PixelPageViewContent />
    </Suspense>
  );
}
