# next-pixels demo

Minimal Next.js App Router app exercising [`next-pixels`](../../) with all three
providers (Meta, TikTok, Google Ads) from a single `track()` call.

## Run

```bash
cp .env.local.example .env.local   # dummy IDs; replace to send live
npm install                        # builds the local next-pixels via file:../..
npm run dev
```

Open <http://localhost:3000> and click **Buy (fire track)**. One `track()` call:

- fires the **client** tags — `fbq('track','Purchase')`, `ttq.track('CompletePayment')`, `gtag('event','conversion')` — all sharing one event id
- POSTs once to **`/api/events`**, which fans out **server-side** to Meta CAPI + TikTok Events API (Google is client-only)

Watch the browser console and the dev-server logs — every line is prefixed `[next-pixels]`.

> In dev (`NODE_ENV=development`) the server returns **mock** responses; no real Meta/TikTok API calls are made. Set real IDs + access tokens and run a production build to deliver live, and verify with each platform's Test Events tool.

## How it's wired

- `app/layout.tsx` — `<Pixel />` (loads every configured provider) + `<PixelPageView />`
- `app/page.tsx` — `setGoogleConversionLabels({ Purchase: "TESTLABEL" })` + a button calling `track(...)`
- `app/api/events/route.ts` — `export const POST = eventsHandler`
