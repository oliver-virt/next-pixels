const isDevelopment = process.env.NODE_ENV === "development";
export function logPixelEvent(event, data, source = "client") {
    if (isDevelopment) {
        console.log(`[next-pixels] ${source} - ${event}:`, data);
    }
}
export function logPixelError(message, error, source = "client") {
    if (isDevelopment) {
        console.error(`[next-pixels] ${source} - ${message}:`, error);
    }
}
export function logPixelWarning(message, source) {
    if (isDevelopment) {
        console.warn(`[next-pixels] ${source ? source + " - " : ""}${message}`);
    }
}
//# sourceMappingURL=logger.js.map