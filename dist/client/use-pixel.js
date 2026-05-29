"use client";
import { useCallback } from "react";
import { track as trackEvent } from "./track.js";
/**
 * React hook for tracking Facebook Pixel + CAPI events.
 *
 * @example
 * ```tsx
 * import { usePixel } from "next-pixels";
 *
 * function CheckoutButton() {
 *   const { track } = usePixel();
 *
 *   return (
 *     <button onClick={() => track({
 *       eventName: "InitiateCheckout",
 *       data: { value: 49.99, currency: "USD" },
 *     })}>
 *       Checkout
 *     </button>
 *   );
 * }
 * ```
 */
export function usePixel() {
    const track = useCallback((options) => {
        try {
            trackEvent(options);
        }
        catch (error) {
            console.error("[next-pixels] Failed to track event:", error);
        }
    }, []);
    return { track };
}
//# sourceMappingURL=use-pixel.js.map