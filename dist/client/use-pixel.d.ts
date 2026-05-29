import type { TrackOptions } from "../types.js";
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
export declare function usePixel(): {
    track: (options: TrackOptions) => void;
};
//# sourceMappingURL=use-pixel.d.ts.map