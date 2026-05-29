import type {
  FacebookEventData,
  TikTokUserData,
  TikTokProperties,
  TikTokEventPayload,
} from "../types.js";
import { hashData, toE164 } from "../utils/hash.js";
import { toTikTokEventName } from "../event-map.js";
import { isDevMode } from "./dev-capi-service.js";

const TIKTOK_API_URL =
  "https://business-api.tiktok.com/open_api/v1.3/event/track/";

/** True when the TikTok provider is configured (Pixel ID present). */
export function isTikTokConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
}

// --- Data transformation ---

async function transformUserData(
  data: FacebookEventData
): Promise<TikTokUserData> {
  const user: TikTokUserData = {};

  // TikTok's user fields are single hashed strings; use the first identifier.
  if (data.emails?.length) {
    user.email = await hashData(data.emails[0]);
  }
  if (data.phones?.length) {
    user.phone = await hashData(toE164(data.phones[0]));
  }
  if (data.ttp) user.ttp = data.ttp;
  if (data.userAgent) user.user_agent = data.userAgent;

  return user;
}

function transformProperties(data: FacebookEventData): TikTokProperties {
  const properties: TikTokProperties = {};

  if (data.products?.length) {
    properties.content_type = "product";
    properties.contents = data.products.map((product) => ({
      content_id: product.sku,
      quantity: product.quantity,
    }));
  }
  if (data.value) properties.value = data.value;
  if (data.currency) properties.currency = data.currency;

  return properties;
}

async function createEventPayload(
  data: FacebookEventData
): Promise<TikTokEventPayload> {
  return {
    event: toTikTokEventName(data.eventName, data.tiktokEventName),
    event_time: Math.floor(Date.now() / 1000),
    event_id: data.eventId,
    user: await transformUserData(data),
    properties: transformProperties(data),
    ...(data.sourceUrl && { page: { url: data.sourceUrl } }),
  };
}

// --- Main export ---

/**
 * Send an event to TikTok's Events API 2.0 (server-side).
 *
 * In development mode, logs the event and returns a mock response.
 * In production, hashes PII and POSTs to the Events API.
 *
 * Required env vars: `TIKTOK_ACCESS_TOKEN`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID`
 *
 * @see https://business-api.tiktok.com/portal/docs?id=1771101027431426
 */
export async function sendTikTokServerEvent(eventData: FacebookEventData) {
  if (isDevMode()) {
    const payload = await createEventPayload(eventData);
    console.log("[next-pixels] dev - TikTok event:", {
      event: payload.event,
      event_id: payload.event_id,
      hasTtp: !!eventData.ttp,
      hasEmail: !!eventData.emails?.length,
      sourceUrl: eventData.sourceUrl,
    });
    return {
      code: 0,
      message: "OK (dev mock)",
      request_id: `dev-trace-${Date.now()}`,
    };
  }

  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

  if (!accessToken || !pixelId) {
    throw new Error(
      "[next-pixels] Missing TIKTOK_ACCESS_TOKEN or NEXT_PUBLIC_TIKTOK_PIXEL_ID"
    );
  }

  if (!eventData.eventName || !eventData.eventId) {
    throw new Error("[next-pixels] Missing required eventName or eventId");
  }

  const payload = {
    event_source: "web",
    event_source_id: pixelId,
    data: [await createEventPayload(eventData)],
    ...(eventData.testEventCode && {
      test_event_code: eventData.testEventCode,
    }),
  };

  const response = await fetch(TIKTOK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": accessToken,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  // TikTok returns HTTP 200 with a non-zero `code` on logical errors.
  if (!response.ok || (result && typeof result.code === "number" && result.code !== 0)) {
    console.error("[next-pixels] TikTok API error:", result);
    throw new Error(
      `[next-pixels] TikTok API error: ${JSON.stringify(result)}`
    );
  }

  return result;
}
