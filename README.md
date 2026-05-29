# next-pixels

Facebook **and TikTok** Pixel + server-side Conversions / Events API for Next.js App Router.

One `track()` call fires both the browser pixel and the server API for every configured provider, with automatic deduplication, PII hashing, and TypeScript support.

## Why this exists

**The problem.** A browser pixel alone (`fbq`, `ttq`) misses a large and growing share of conversions:

- **Ad blockers & tracking protection** drop the pixel script entirely — often 10–30% of traffic.
- **Safari/iOS (ITP)** cap first-party cookie lifetime to ~7 days, so returning users look brand new and attribution breaks.
- **Network flakiness, early tab-close, and CSP** mean client beacons silently never arrive.

Under-reported conversions don't just dent your dashboards — they starve the ad platforms' optimization models, so you pay more for worse targeting.

**The fix the platforms recommend.** Send each event **twice**: once from the browser (pixel) and once from your server (Meta Conversions API / TikTok Events API). The server call runs even when the browser one is blocked, and carries hashed first-party data (email, phone) for stronger matching. To avoid counting the same conversion twice, both hits share one **event ID** that the platform deduplicates on.

```mermaid
flowchart TB
    C(["🛒 User converts"])

    subgraph NO ["❌ WITHOUT — browser pixel only"]
        direction LR
        PX1["Browser pixel"]
        PX1 -->|"blocked: ad blocker · iOS/ITP · tab close"| LOST["💥 conversion LOST"]
        PX1 -->|"otherwise"| AD1["Ad platform"]
    end

    subgraph YES ["✅ WITH next-pixels — pixel + server"]
        direction LR
        PX2["Browser pixel"] --> AD2["Ad platform"]
        SRV["Your server → Conversions / Events API"] --> AD2
        AD2 --> ONCE(["counted once — deduped by event_id"])
    end

    C --> PX1
    C --> PX2
    C --> SRV

    classDef bad  fill:#2a0e0e,stroke:#ef4444,stroke-width:2px,color:#fecaca;
    classDef good fill:#0c2a18,stroke:#22c55e,stroke-width:2px,color:#bbf7d0;
    classDef box  fill:#1f2937,stroke:#9ca3af,color:#f3f4f6;
    classDef start fill:#1e3a8a,stroke:#60a5fa,color:#dbeafe;

    class C start;
    class LOST bad;
    class ONCE,SRV good;
    class PX1,PX2,AD1,AD2 box;

    style NO  fill:#170a0a,stroke:#ef4444,stroke-width:2px,color:#fca5a5;
    style YES fill:#0a1a12,stroke:#22c55e,stroke-width:2px,color:#86efac;
```

The server path has no script to block, so the conversion still lands even when the browser pixel doesn't.

| | Browser pixel only | next-pixels (pixel + server) |
|---|---|---|
| Client blocked (ad blocker / ITP) | ❌ conversion lost | ✅ server still reports it |
| Match quality | cookie only | cookie **+** hashed email/phone |
| Double-counting | — | ✅ deduped by shared `event_id` |
| Adding Meta **and** TikTok | wire each by hand, twice | one `track()` call |

**Why a package.** Wiring that up correctly is fiddly and easy to get subtly wrong — generating and threading a shared ID, hashing PII the way each platform expects (Meta wants digits-only phones, TikTok wants E.164), mapping event names across platforms (`Purchase` ↔ `CompletePayment`), and repeating all of it per provider. `next-pixels` collapses it into a single `track()` call that fans out to every configured provider on both client and server, deduped — so you write the event once and get reliable attribution everywhere.

## Features

- **Multi-provider** — Meta (Facebook) and TikTok from a single `track()` call
- **Pixel + server API** — Sends events to both browser and server for maximum attribution (Meta CAPI + TikTok Events API)
- **Auto-deduplication** — A shared event ID prevents double-counting on each platform
- **Auto event mapping** — Meta event names map to TikTok equivalents (e.g. `Purchase` → `CompletePayment`)
- **PII hashing** — SHA256 hashing of emails, phones, names before sending
- **App Router** — Built for Next.js 13+ App Router with `"use client"` components
- **TypeScript** — Full type safety with exported interfaces
- **Dev mode** — Mock responses and fallback cookies in development
- **Zero dependencies** — Only `next` and `react` as peer deps

## Quick Start

### 1. Install

```bash
npm install next-pixels
```

### 2. Add environment variables

Set the providers you use — each is optional and activates independently.

```bash
# .env.local

# Meta (Facebook)
NEXT_PUBLIC_FB_PIXEL_ID=123456789       # Pixel ID
FB_PIXEL_ACCESS_TOKEN=EAAx...           # CAPI access token (server only)

# TikTok
NEXT_PUBLIC_TIKTOK_PIXEL_ID=D8CNI...    # Pixel / sdkid
TIKTOK_ACCESS_TOKEN=...                 # Events API access token (server only)
```

### 3. Add to your layout

```tsx
// app/layout.tsx
import { Pixel, PixelPageView } from "next-pixels";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Pixel />          {/* loads every configured provider's script */}
        <PixelPageView />  {/* PageView on every route change */}
      </body>
    </html>
  );
}
```

`<Pixel />` renders only the providers whose env vars are set. Prefer per-provider control? Use `<FacebookPixel />` and `<TikTokPixel />` directly.

### 4. Create the API route (for server-side forwarding)

```ts
// app/api/events/route.ts
import { eventsHandler } from "next-pixels/handlers";
export const POST = eventsHandler;
```

### 5. Track events

```tsx
import { track } from "next-pixels";

// Fires Meta "Lead" + TikTok "SubmitForm", deduped, client + server
track({ eventName: "Lead" });

// With data + PII for better server-side matching
track({
  eventName: "Purchase",                 // Meta name; mapped to TikTok "CompletePayment"
  data: { value: 29.99, currency: "USD" },
  emails: ["user@example.com"],
  phones: ["+972501234567"],
});
```

## How multi-provider tracking works

When you call `track()`:

1. A unique `eventId` (UUID v4) is generated.
2. The client fires each loaded pixel with that id:
   - Meta: `fbq('track', 'Purchase', { eventID })`
   - TikTok: `ttq.track('CompletePayment', {...}, { event_id })`
3. A single POST to `/api/events` forwards the event to each configured server API:
   - Meta Conversions API (`event_id`)
   - TikTok Events API (`event_id`)
4. Each platform matches its client + server events by id and counts them once.

```mermaid
flowchart TD
    T["track({ eventName: 'Purchase' })"] --> ID["Generate one event_id (UUID)"]

    ID --> FBC["fbq('track','Purchase')"]
    ID --> POST["POST /api/events"]
    POST --> FBS["Meta Conversions API"]
    POST --> TTS["TikTok Events API"]
    ID --> TTC["ttq.track('CompletePayment')"]

    FBC --> FB(("Meta"))
    FBS --> FB
    TTS --> TT(("TikTok"))
    TTC --> TT

    FB --> FBD["dedup by event_id ✅"]
    TT --> TTD["dedup by event_id ✅"]
```

The event-name map (`Purchase` → `CompletePayment`, `Lead` → `SubmitForm`, etc.) is applied automatically. Override per call with `tiktokEventName`, or read/extend the map via the exported `META_TO_TIKTOK_EVENTS` / `toTikTokEventName`.

## API Reference

### Components

#### `<Pixel />`

Loads the script for every configured provider. Add once in your root layout.

#### `<FacebookPixel />` / `<TikTokPixel />`

Load a single provider's pixel. Each renders nothing if its `NEXT_PUBLIC_*_PIXEL_ID` is unset.

#### `<PixelPageView />`

Tracks `PageView` on every route change, across all configured providers.

### Client Functions

#### `track(options)`

Track an event on every configured provider — client pixel + server API.

```ts
track({
  eventName: "Purchase",          // Required — Meta-style name, mapped to TikTok
  data: {                         // Optional — event parameters (value, currency, ...)
    value: 29.99,
    currency: "USD",
  },
  emails: ["user@example.com"],   // Optional — hashed, sent server-side
  phones: ["+1234567890"],        // Optional — hashed, sent server-side
  firstName: "John",              // Optional
  lastName: "Doe",                // Optional
  tiktokEventName: "ViewContent", // Optional — explicit TikTok name (overrides the map)
  apiRoute: "/api/events",        // Optional — default: "/api/events"
});
```

`fbEvent(options)` is a deprecated alias for `track` (same signature), kept for backward compatibility.

#### `usePixel()`

React hook wrapper for `track`.

```tsx
const { track } = usePixel();
track({ eventName: "AddToCart", data: { value: 19.99 } });
```

#### Low-level per-provider helpers

- `trackStandardEvent(name, options?, eventID?)` — `fbq('track', ...)` only
- `trackCustomEvent(name, options, eventID)` — `fbq('trackCustom', ...)` only
- `trackTikTokEvent(name, options?, eventID?, tiktokNameOverride?)` — `ttq.track(...)` only
- `trackPageView(...)` / `trackTikTokPageView()` — per-provider PageView
- `isPixelInitialized()` / `isTikTokInitialized()` — script-loaded checks

### Event name mapping

```ts
import { META_TO_TIKTOK_EVENTS, toTikTokEventName } from "next-pixels";

toTikTokEventName("Purchase");            // "CompletePayment"
toTikTokEventName("MyCustom");            // "MyCustom" (passthrough)
toTikTokEventName("Lead", "ViewContent"); // "ViewContent" (override)
```

Standard events: Meta — `Lead`, `Purchase`, `AddToCart`, `InitiateCheckout`, `ViewContent`, `CompleteRegistration`, `Subscribe`, `Search`. TikTok — `CompletePayment`, `SubmitForm`, `AddToCart`, `InitiateCheckout`, `ViewContent`, `CompleteRegistration`, `Subscribe`, `Search`, `PlaceAnOrder`, `Contact`.

### Server Functions

#### `sendServerEvent(eventData)`

Forward an event to every configured provider's server API. Returns a per-provider result object: `{ meta?: {...}, tiktok?: {...} }`. Use for server-side events (API routes, Server Actions).

```ts
import { sendServerEvent } from "next-pixels/server";

const result = await sendServerEvent({
  eventName: "Lead",
  eventId: "unique-uuid",
  emails: ["user@example.com"],
  sourceUrl: "https://example.com/form",
});
// result -> { meta: { ok: true, result }, tiktok: { ok: true, result } }
```

Per-provider helpers are also exported: `sendMetaServerEvent`, `sendTikTokServerEvent`, plus `isMetaConfigured()` / `isTikTokConfigured()`.

### Handler

#### `eventsHandler`

Pre-built Next.js POST handler that fans out to all configured providers.

```ts
// app/api/events/route.ts
import { eventsHandler } from "next-pixels/handlers";
export const POST = eventsHandler;
```

`fbEventsHandler` remains exported as a deprecated alias.

## Environment Variables

| Variable | Required | Side | Description |
|---|---|---|---|
| `NEXT_PUBLIC_FB_PIXEL_ID` | For Meta | Client + Server | Facebook Pixel ID |
| `FB_PIXEL_ACCESS_TOKEN` | For Meta CAPI | Server only | Meta [System User access token](https://developers.facebook.com/docs/marketing-api/conversions-api/get-started/#access-token) |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | For TikTok | Client + Server | TikTok Pixel ID / sdkid |
| `TIKTOK_ACCESS_TOKEN` | For TikTok Events API | Server only | TikTok [Events API access token](https://business-api.tiktok.com/portal/docs?id=1771101027431426) |
| `FB_TEST_EVENT_CODE` | No | Server only | Meta test event code for development |

A provider activates only when its `NEXT_PUBLIC_*_PIXEL_ID` is set — so this package works with Meta only, TikTok only, or both.

## Getting your credentials

New to pixels? Here's where each value comes from. You only need credentials for the provider(s) you actually use.

### Meta (Facebook)

1. **Pixel ID** → open [Meta Events Manager](https://business.facebook.com/events_manager2), create (or select) a Data Source of type **Web**. The numeric **Pixel ID** shown there is your `NEXT_PUBLIC_FB_PIXEL_ID`.
2. **Conversions API access token** → in Events Manager, open your pixel → **Settings** → **Conversions API** → **Generate access token**. That value is `FB_PIXEL_ACCESS_TOKEN` (keep it server-side only).
3. Docs: [Meta Pixel — get started](https://developers.facebook.com/docs/meta-pixel/get-started) · [Conversions API — get started](https://developers.facebook.com/docs/marketing-api/conversions-api/get-started) (incl. the [access token](https://developers.facebook.com/docs/marketing-api/conversions-api/get-started/#access-token) step).

### TikTok

1. **Pixel ID** → open [TikTok Events Manager](https://ads.tiktok.com/i18n/events_manager) (TikTok Ads Manager → **Tools → Events Manager**), **Connect Data Source → Web**, create a pixel. The **Pixel ID** (the `sdkid` in the snippet) is your `NEXT_PUBLIC_TIKTOK_PIXEL_ID`.
2. **Events API access token** → in Events Manager, open your pixel → **Settings** → generate an **Events API** access token. That value is `TIKTOK_ACCESS_TOKEN` (server-side only).
3. Docs: [TikTok Pixel — get started](https://ads.tiktok.com/help/article/get-started-pixel) · [Events API 2.0](https://business-api.tiktok.com/portal/docs?id=1771101027431426).

> Pixel IDs are public (they ship in the browser, hence the `NEXT_PUBLIC_` prefix). Access tokens are **secrets** — never expose them client-side; this package only ever uses them in server code.

## Cookie Consent

This package does **not** enforce cookie consent. Conditionally render the components if you need gating:

```tsx
function Layout({ children }) {
  const hasConsent = useCookieConsent(); // your consent hook
  return (
    <>
      {children}
      {hasConsent && <Pixel />}
      {hasConsent && <PixelPageView />}
    </>
  );
}
```

`track()` silently no-ops on the client for any pixel whose script hasn't loaded.

## CSP (Content Security Policy)

If you use CSP headers, add these domains:

```
script-src:  https://connect.facebook.net https://analytics.tiktok.com
connect-src: https://connect.facebook.net https://www.facebook.com https://analytics.tiktok.com https://business-api.tiktok.com
img-src:     https://www.facebook.com
```

## Development Mode

In development (`NODE_ENV=development`):

- The API route returns mock responses for each provider (no real API calls)
- Missing `_fbp`/`_fbc` cookies are replaced with realistic fallbacks
- All events are logged to the console with `[next-pixels]` prefix
- Set `FB_TEST_EVENT_CODE` to test with Meta's Test Events tool

## License

MIT
