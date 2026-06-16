# Word of Mouth — Progressive Web App (PWA)

Word of Mouth is installable as a Progressive Web App while keeping the same website, layout, and user flows. This document explains what was added, how it works, and how to test and deploy it.

## What Was Added

| Piece | Location | Purpose |
|-------|----------|---------|
| Web App Manifest | `src/app/manifest.ts` | Tells browsers the app name, icons, colors, and `standalone` display mode |
| Service worker | Generated at build → `public/sw.js` | Caches static assets and serves an offline fallback |
| PWA plugin | `next.config.ts` (`@ducanh2912/next-pwa`) | Builds and registers the service worker in production |
| App icons | `public/icon-*.png`, `public/apple-touch-icon.png`, `public/favicon.*` | Cubao WOM wordmark (coral on cream) |
| Splash screens | `public/splash/` | iOS startup images (cream background + brand icon) |
| Offline page | `src/app/~offline/page.tsx` | Shown when navigation fails while offline |
| Install prompt | `src/components/pwa/InstallPrompt.tsx` | Chrome / Android / desktop install banner |
| iOS install hint | `src/components/pwa/IosInstallHint.tsx` | Safari “Add to Home Screen” guidance |
| Icon generator | `scripts/generate-pwa-icons.mjs` | Regenerates Cubao favicon/PWA/splash assets from `wom-icon-master.svg` |
| Middleware update | `src/middleware.ts` | Excludes PWA assets from auth redirects |

## What Was Not Changed

- Page layouts, typography, colors, branding, bottom navigation
- Authentication (Supabase email/password)
- Friends, recommendations, search, profile, saved tabs
- Database schema and server actions
- Desktop and mobile web behavior when **not** installed

## How It Works

### Install flow

1. User visits WOM over **HTTPS** in a supported browser.
2. The browser reads `/manifest.webmanifest` (from `src/app/manifest.ts`).
3. On production build, `@ducanh2912/next-pwa` generates `public/sw.js` and registers it.
4. The user installs via:
   - **Android Chrome:** “Install app” or the in-app install banner
   - **iPhone Safari:** Share → Add to Home Screen (hint banner after a few seconds)
   - **Desktop Chrome/Edge:** Install icon in the address bar

### Standalone mode

The manifest sets `display: "standalone"`. When launched from the home screen, browser chrome (URL bar, tabs) is hidden. Navigation and styling match the existing mobile web app.

### Offline behavior

WOM is an online-first app (Supabase auth and data). The service worker:

- **Caches** JS, CSS, fonts, and icons for faster repeat loads
- **Does not** replace live friend/recommendation data when offline
- **Shows** `/~offline` when a page request fails with no network

Auth sessions continue to work when online after install because cookies and Supabase calls are unchanged.

### Service worker lifecycle

- Built only on `npm run build` (disabled in `npm run dev`)
- `skipWaiting` + `clientsClaim` activate updates quickly
- `reloadOnOnline` refreshes when connectivity returns
- Generated SW files are gitignored; CI/production builds regenerate them

## Regenerating Icons

If you change brand colors or the Cubao font:

```bash
npm run generate:pwa-icons
```

This updates `public/apple-touch-icon.png`, `public/favicon-16x16.png`, `public/favicon-32x32.png`, `src/app/icon.png`, `public/icon-*.png`, and `public/splash/`.

## Testing

### Prerequisites

```bash
npm run build
npm start
```

Open `http://localhost:3000` (PWA features are **production build only**; dev mode disables the service worker).

For full install testing, deploy to HTTPS or use a tunnel (e.g. ngrok) — some install APIs require secure contexts.

### iPhone (Safari)

1. Open the production URL on your iPhone.
2. Sign in and confirm the app works normally.
3. Tap **Share** → **Add to Home Screen**.
4. Launch from the new icon.
5. Confirm: no Safari UI, cream theme, bottom nav works, auth persists.
6. Optional: enable Airplane Mode, reload — you should see the offline page.

### Android (Chrome)

1. Open the production URL.
2. Use **Install app** from the menu or the in-app install banner.
3. Launch from the home screen.
4. Confirm standalone mode and normal auth/data flows.

### Desktop (Chrome / Edge)

1. Open the production URL.
2. Click the install icon in the address bar (or use the install banner).
3. Open the installed window — it should behave like the site without browser tabs.

### Verify PWA assets (no auth redirect)

These URLs must **not** redirect to `/login`:

- `/manifest.webmanifest`
- `/sw.js`
   - `/icon-512x512.png`

### Lighthouse PWA audit

Lighthouse 13+ removed the dedicated **PWA** category. Use Lighthouse 11 for installability scoring, or verify manually in Chrome DevTools → Application.

```bash
npm run build
npm start &
npx lighthouse@11.7.1 http://localhost:3000/login --only-categories=pwa --output=html --output-path=./lighthouse-pwa-report.html --chrome-flags="--headless"
```

**Latest local audit (Lighthouse 11.7.1, `/login`, production build):**

| Audit | Result |
|-------|--------|
| PWA score | **100** |
| installable-manifest | Pass |
| maskable-icon | Pass |
| splash-screen | Pass |
| themed-omnibox | Pass |
| viewport | Pass |
| content-width | Pass |

**Note:** `maximumScale: 1` (pre-existing) may warn on accessibility audits in newer Lighthouse versions. It was intentionally left unchanged to preserve the current mobile experience.

## Deployment

1. **Deploy as usual** (e.g. Vercel connected to your repo).
2. Ensure environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Production build automatically generates `public/sw.js` and Workbox bundles.
4. After deploy, verify on your live HTTPS URL:
   - Manifest loads
   - Service worker registers (DevTools → Application → Service Workers)
   - Install works on mobile and desktop

No Supabase or database migration is required for PWA.

## Capacitor / App Store (Future)

This setup is Capacitor-ready:

- Static icons in `public/` can become native app icons
- The same deployed HTTPS URL can load inside a WebView
- Manifest metadata aligns with native wrapper configuration
- No custom routing or auth rewrites needed for a first Capacitor pass

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Install option missing | Must use HTTPS and a production build |
| `/sw.js` redirects to login | Middleware matcher should exclude `sw.js` — see `src/middleware.ts` |
| Stale app after deploy | Hard refresh or close/reopen installed app; SW updates on next visit |
| **Unstyled / plain HTML in production** | Stop any old `next start` process, run `rm -rf .next && npm run build && npm start`, then hard refresh. In DevTools → Application, unregister the service worker and clear site data if CSS still 404s/400s |
| iOS no install dialog | Expected — use Share → Add to Home Screen |
| Offline shows login errors | Use installed app offline test; expect offline fallback, not full data |
