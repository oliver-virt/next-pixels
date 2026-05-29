const isDevelopment = process.env.NODE_ENV === "development";

export function logPixelEvent(
  event: string,
  data?: Record<string, unknown>,
  source: "client" | "server" = "client"
) {
  if (isDevelopment) {
    console.log(`[next-meta-pixel] ${source} - ${event}:`, data);
  }
}

export function logPixelError(
  message: string,
  error?: unknown,
  source: "client" | "server" = "client"
) {
  if (isDevelopment) {
    console.error(`[next-meta-pixel] ${source} - ${message}:`, error);
  }
}

export function logPixelWarning(
  message: string,
  source?: "client" | "server"
) {
  if (isDevelopment) {
    console.warn(
      `[next-meta-pixel] ${source ? source + " - " : ""}${message}`
    );
  }
}
