"use client";

import { logPixelEvent, logPixelWarning } from "../utils/logger.js";

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

export function isPixelInitialized(): boolean {
  return typeof window !== "undefined" && typeof window.fbq !== "undefined";
}

/** Track a PageView event (called automatically by PixelPageView on route changes) */
export function trackPageView(
  pathname: string,
  searchParams: { entries(): IterableIterator<[string, string]> }
) {
  if (!isPixelInitialized()) {
    logPixelWarning("fbq is not initialized", "client");
    return;
  }

  window.fbq("track", "PageView");
  logPixelEvent("PageView", {
    pathname,
    searchParams: Object.fromEntries(searchParams.entries()),
  });
}

/** Track a standard Facebook event (e.g., "Lead", "Purchase", "ViewContent") */
export function trackStandardEvent(
  name: string,
  options: Record<string, unknown> = {},
  eventID?: string
) {
  if (!isPixelInitialized()) {
    logPixelWarning("fbq is not initialized", "client");
    return;
  }

  const eventOptions = eventID ? { ...options, eventID } : options;
  window.fbq("track", name, eventOptions);
  logPixelEvent(`Standard event: ${name}`, { eventID, ...options });
}

/** Track a custom Facebook event with deduplication eventID */
export function trackCustomEvent(
  name: string,
  options: Record<string, unknown> = {},
  eventID: string
) {
  if (!isPixelInitialized()) {
    logPixelWarning("fbq is not initialized", "client");
    return;
  }

  window.fbq("trackCustom", name, { ...options, eventID });
  logPixelEvent(`Custom event: ${name}`, { eventID, ...options });
}
