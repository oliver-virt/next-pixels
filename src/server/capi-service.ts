import type {
  FacebookEventData,
  FacebookUserData,
  FacebookCustomData,
  FacebookEventPayload,
} from "../types.js";
import { hashData, digitsOnly } from "../utils/hash.js";
import { sendServerEventDev, isDevMode } from "./dev-capi-service.js";
import {
  sendTikTokServerEvent,
  isTikTokConfigured,
} from "./tiktok-events-service.js";

const FACEBOOK_API_VERSION = "v21.0";
const FACEBOOK_API_BASE_URL = "https://graph.facebook.com";

// --- Data transformation ---

async function transformUserData(data: FacebookEventData): Promise<FacebookUserData> {
  const userData: FacebookUserData = {};

  if (data.emails?.length) {
    userData.em = await Promise.all(data.emails.map(hashData));
  }
  if (data.phones?.length) {
    userData.ph = await Promise.all(
      data.phones.map((phone) => hashData(digitsOnly(phone)))
    );
  }
  if (data.firstName) userData.fn = await hashData(data.firstName);
  if (data.lastName) userData.ln = await hashData(data.lastName);
  if (data.country) userData.country = await hashData(data.country);
  if (data.city) userData.ct = await hashData(data.city);
  if (data.zipCode) userData.zp = await hashData(data.zipCode);
  if (data.userAgent) userData.client_user_agent = data.userAgent;

  return userData;
}

function transformCustomData(data: FacebookEventData): FacebookCustomData {
  const customData: FacebookCustomData = {};

  if (data.products?.length) {
    customData.content_type = "product";
    customData.contents = data.products.map((product) => ({
      id: product.sku,
      quantity: product.quantity,
    }));
  }
  if (data.value) customData.value = data.value;
  if (data.currency) customData.currency = data.currency;
  if (data.sourceUrl) customData.source_url = data.sourceUrl;

  return customData;
}

// --- Validation ---

function validateCustomerData(data: FacebookEventData): {
  isValid: boolean;
  error?: string;
} {
  const hasEmail = Array.isArray(data.emails) && data.emails.length > 0;
  const hasPhone = Array.isArray(data.phones) && data.phones.length > 0;
  const hasName = data.firstName && data.lastName;
  const hasLocation = data.city && data.country;
  const hasZip = data.zipCode;
  const hasFbCookies = data.fbp || data.fbc;

  if (
    !hasEmail &&
    !hasPhone &&
    !hasName &&
    !(hasLocation && hasZip) &&
    !hasFbCookies
  ) {
    return {
      isValid: false,
      error:
        "Insufficient customer data. Provide at least one of: email, phone, full name, location (city + country + zip), or fbp/fbc cookie.",
    };
  }

  return { isValid: true };
}

async function createEventPayload(data: FacebookEventData): Promise<FacebookEventPayload> {
  const userData = await transformUserData(data);

  if (data.fbp) userData.fbp = data.fbp;
  if (data.fbc) userData.fbc = data.fbc;

  return {
    event_name: data.eventName,
    event_id: data.eventId,
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data: userData,
    custom_data: transformCustomData(data),
  };
}

// --- Meta (Facebook) Conversions API ---

/** True when the Meta provider is configured (Pixel ID present). */
export function isMetaConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_FB_PIXEL_ID;
}

/**
 * Send an event to Facebook's Conversions API (server-side).
 *
 * In development mode, logs the event and returns a mock response.
 * In production, validates data, hashes PII, and sends to Graph API.
 *
 * Required env vars: `FB_PIXEL_ACCESS_TOKEN`, `NEXT_PUBLIC_FB_PIXEL_ID`
 */
export async function sendMetaServerEvent(eventData: FacebookEventData) {
  if (isDevMode()) {
    return sendServerEventDev(eventData);
  }

  const accessToken = process.env.FB_PIXEL_ACCESS_TOKEN;
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

  if (!accessToken || !pixelId) {
    throw new Error(
      "[next-pixels] Missing FB_PIXEL_ACCESS_TOKEN or NEXT_PUBLIC_FB_PIXEL_ID"
    );
  }

  if (!eventData.eventName || !eventData.eventId) {
    throw new Error("[next-pixels] Missing required eventName or eventId");
  }

  const validation = validateCustomerData(eventData);
  if (!validation.isValid) {
    throw new Error(`[next-pixels] ${validation.error}`);
  }

  const payload = {
    data: [await createEventPayload(eventData)],
    access_token: accessToken,
    ...(eventData.testEventCode && {
      test_event_code: eventData.testEventCode,
    }),
  };

  const response = await fetch(
    `${FACEBOOK_API_BASE_URL}/${FACEBOOK_API_VERSION}/${pixelId}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error("[next-pixels] Facebook API error:", result);
    throw new Error(
      `[next-pixels] Facebook API error: ${JSON.stringify(result)}`
    );
  }

  return result;
}

// --- Unified dispatcher ---

/** Per-provider result of a unified {@link sendServerEvent} call. */
export interface ServerEventResult {
  meta?: { ok: boolean; result?: unknown; error?: string };
  tiktok?: { ok: boolean; result?: unknown; error?: string };
}

/**
 * Send an event to every configured provider's server API (Meta CAPI +
 * TikTok Events API). A provider runs when its public pixel-id env var is set;
 * if none is set, Meta is assumed for backward compatibility.
 *
 * Failures are isolated per provider — one provider erroring does not prevent
 * the other from sending. The returned object reports each provider's outcome.
 */
export async function sendServerEvent(
  eventData: FacebookEventData
): Promise<ServerEventResult> {
  const providers: Array<{
    key: keyof ServerEventResult;
    run: () => Promise<unknown>;
  }> = [];

  const metaOn = isMetaConfigured();
  const tiktokOn = isTikTokConfigured();

  // Backward compat: with no provider env configured, default to Meta.
  if (metaOn || (!metaOn && !tiktokOn)) {
    providers.push({ key: "meta", run: () => sendMetaServerEvent(eventData) });
  }
  if (tiktokOn) {
    providers.push({
      key: "tiktok",
      run: () => sendTikTokServerEvent(eventData),
    });
  }

  const settled = await Promise.allSettled(providers.map((p) => p.run()));

  const out: ServerEventResult = {};
  settled.forEach((res, i) => {
    const key = providers[i].key;
    if (res.status === "fulfilled") {
      out[key] = { ok: true, result: res.value };
    } else {
      const message =
        res.reason instanceof Error ? res.reason.message : String(res.reason);
      console.error(`[next-pixels] ${key} server event failed:`, message);
      out[key] = { ok: false, error: message };
    }
  });

  return out;
}
