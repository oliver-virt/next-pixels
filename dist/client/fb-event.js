"use client";
/**
 * Backward-compatible re-export. The implementation now lives in `track.ts`
 * and fans out to every configured provider (Meta + TikTok).
 *
 * @deprecated Import `track` from "next-meta-pixel" instead of `fbEvent`.
 */
export { track, fbEvent } from "./track.js";
//# sourceMappingURL=fb-event.js.map