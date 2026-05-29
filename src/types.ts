/** Product data for e-commerce events */
export interface Product {
  sku: string;
  quantity: number;
}

/** Event data sent to both client-side Pixel and server-side CAPI */
export interface FacebookEventData {
  [key: string]: unknown;
  /** Facebook standard or custom event name (e.g., "Lead", "Purchase", "ViewContent") */
  eventName: string;
  /** Unique event ID for deduplication between Pixel and CAPI */
  eventId: string;
  /** User email addresses (hashed before sending to Facebook) */
  emails?: string[];
  /** User phone numbers (hashed before sending to Facebook) */
  phones?: string[];
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  zipCode?: string;
  products?: Product[];
  value?: number;
  currency?: string;
  userAgent?: string;
  sourceUrl?: string;
  /** Facebook test event code for development/testing */
  testEventCode?: string;
  /** Facebook Browser ID cookie (_fbp) */
  fbp?: string;
  /** Facebook Click ID cookie (_fbc) */
  fbc?: string;
  /** TikTok Pixel cookie (_ttp) */
  ttp?: string;
  /**
   * Explicit TikTok event name. Overrides the Meta→TikTok name mapping
   * (e.g. set this if `eventName` is custom and should differ on TikTok).
   */
  tiktokEventName?: string;
}

/** Alias for {@link FacebookEventData} — the provider-agnostic event payload. */
export type EventData = FacebookEventData;

/** Options for track() — the main client-side tracking function */
export interface TrackOptions {
  /** Standard or custom event name (Meta-style; mapped to TikTok automatically) */
  eventName: string;
  /** Additional event data (value, currency, content_name, etc.) */
  data?: Record<string, unknown>;
  /** User email addresses for server-side matching (hashed before sending) */
  emails?: string[];
  /** User phone numbers for server-side matching (hashed before sending) */
  phones?: string[];
  firstName?: string;
  lastName?: string;
  /**
   * Explicit TikTok event name. Overrides the Meta→TikTok name mapping.
   * Useful for custom events that have a different name on TikTok.
   */
  tiktokEventName?: string;
  /** API endpoint URL for server-side forwarding (default: "/api/events") */
  apiRoute?: string;
}

/** @deprecated Use {@link TrackOptions}. Kept for backward compatibility. */
export type FbEventOptions = TrackOptions;

/** Internal Facebook user data payload (hashed PII) */
export interface FacebookUserData {
  em?: string[];
  ph?: string[];
  fn?: string;
  ln?: string;
  country?: string;
  ct?: string;
  zp?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
}

/** Internal Facebook custom data payload */
export interface FacebookCustomData {
  content_type?: string;
  contents?: Array<{ id: string; quantity: number }>;
  value?: number;
  currency?: string;
  source_url?: string;
}

/** Internal Facebook event payload sent to Graph API */
export interface FacebookEventPayload {
  event_name: string;
  event_id: string;
  event_time: number;
  action_source: string;
  user_data: FacebookUserData;
  custom_data: FacebookCustomData;
}

/** Internal TikTok user data payload (hashed PII + cookies) */
export interface TikTokUserData {
  /** SHA-256 of lowercased, trimmed email */
  email?: string;
  /** SHA-256 of E.164-formatted phone */
  phone?: string;
  /** SHA-256 of an external/user id */
  external_id?: string;
  /** TikTok Pixel cookie (_ttp), unhashed */
  ttp?: string;
  /** TikTok Click ID, unhashed */
  ttclid?: string;
  ip?: string;
  user_agent?: string;
}

/** Internal TikTok event properties payload */
export interface TikTokProperties {
  content_type?: string;
  contents?: Array<{ content_id: string; quantity: number }>;
  value?: number;
  currency?: string;
}

/** Internal TikTok event payload sent to the Events API */
export interface TikTokEventPayload {
  event: string;
  event_time: number;
  event_id: string;
  user: TikTokUserData;
  properties: TikTokProperties;
  page?: { url?: string };
}
