const isDevelopment = process.env.NODE_ENV === "development";
/**
 * Development-mode CAPI handler.
 * Logs the event data and returns a mock Facebook API response.
 */
export async function sendServerEventDev(eventData) {
    const testEventCode = !eventData.fbp && !eventData.fbc
        ? process.env.FB_TEST_EVENT_CODE || "TEST12345"
        : undefined;
    console.log("[next-pixels] dev - Processing event:", {
        eventName: eventData.eventName,
        eventId: eventData.eventId,
        hasFbp: !!eventData.fbp,
        hasFbc: !!eventData.fbc,
        hasEmail: !!(eventData.emails?.length),
        sourceUrl: eventData.sourceUrl,
        ...(testEventCode && { testEventCode }),
    });
    const mockResponse = {
        events_received: 1,
        messages: [],
        fbtrace_id: `dev-trace-${Date.now()}`,
    };
    console.log("[next-pixels] dev - Mock response:", mockResponse);
    return mockResponse;
}
export function isDevMode() {
    return isDevelopment;
}
//# sourceMappingURL=dev-capi-service.js.map