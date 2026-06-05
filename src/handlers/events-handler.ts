import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { FacebookEventData } from "../types.js";
import { sendServerEvent } from "../server/capi-service.js";
import { readAttribution } from "../attribution.js";

/**
 * Backfill click ids from the first-touch attribution cookie (see
 * next-pixels/attribution). Live URL params win when present; the cookie
 * covers conversions that happen days after the ad click, when the click id
 * is long gone from the URL. `fbc` is synthesized from a stored `fbclid`
 * using Meta's documented format.
 */
function withFirstTouch(
  req: NextRequest,
  eventData: FacebookEventData
): FacebookEventData {
  const attr = readAttribution(req);
  if (!attr) return eventData;
  const out = { ...eventData };
  if (!out.ttclid && attr.ttclid) out.ttclid = attr.ttclid;
  if (!out.fbc && attr.fbclid) {
    const ts = attr.ts ? Date.parse(attr.ts) : NaN;
    out.fbc = `fb.1.${Number.isNaN(ts) ? Date.now() : ts}.${attr.fbclid}`;
  }
  return out;
}

/**
 * Next.js App Router API route handler for server-side conversion forwarding.
 *
 * Fans the event out to every configured provider (Meta Conversions API +
 * TikTok Events API). In development each provider returns a mock response.
 *
 * @example
 * ```ts
 * // app/api/events/route.ts
 * import { eventsHandler } from "next-pixels/handlers";
 * export const POST = eventsHandler;
 * ```
 */
export async function eventsHandler(req: NextRequest) {
  try {
    const eventData: FacebookEventData = withFirstTouch(req, await req.json());

    console.log("[next-pixels] Processing server event:", {
      eventName: eventData.eventName,
      eventId: eventData.eventId,
      timestamp: new Date().toISOString(),
    });

    const result = await sendServerEvent(eventData);

    return NextResponse.json({
      success: true,
      message: "Event forwarded to configured providers",
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[next-pixels] Server event failed:", error);
    return NextResponse.json(
      {
        error: "Failed to send event",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
