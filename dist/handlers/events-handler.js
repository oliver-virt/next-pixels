import { NextResponse } from "next/server";
import { sendServerEvent } from "../server/capi-service.js";
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
export async function eventsHandler(req) {
    try {
        const eventData = await req.json();
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
    }
    catch (error) {
        console.error("[next-pixels] Server event failed:", error);
        return NextResponse.json({
            error: "Failed to send event",
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
//# sourceMappingURL=events-handler.js.map