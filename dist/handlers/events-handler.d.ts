import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
/**
 * Next.js App Router API route handler for server-side conversion forwarding.
 *
 * Fans the event out to every configured provider (Meta Conversions API +
 * TikTok Events API). In development each provider returns a mock response.
 *
 * @example
 * ```ts
 * // app/api/events/route.ts
 * import { eventsHandler } from "next-meta-pixel/handlers";
 * export const POST = eventsHandler;
 * ```
 */
export declare function eventsHandler(req: NextRequest): Promise<NextResponse<{
    success: boolean;
    message: string;
    result: import("../server.js").ServerEventResult;
    timestamp: string;
}> | NextResponse<{
    error: string;
    timestamp: string;
}>>;
//# sourceMappingURL=events-handler.d.ts.map