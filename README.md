# Word of Mouth (WOM)

Find the people your people trust.

WOM is a trusted recommendation network where people share the service providers ("their guys") they actually use and trust in real life. Instead of relying on anonymous reviews, WOM lets users discover plumbers, babysitters, landscapers, dog walkers, handymen, hair stylists, and other local service providers through friends, neighbors, and people they personally trust.

The app is built around the idea: "I don't want the highest-rated person on the internet. I want the person my friend would hire again."

A mobile-first web app for discovering trusted local service providers through friends — not anonymous reviews.

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase Auth**
- **Supabase Database**

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 3. Run the database schema

In the Supabase SQL Editor, paste and run the contents of `supabase/schema.sql`.

If signup fails with "Database error saving new user", also run `supabase/fix-signup.sql`.

### 4. Configure environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Set these values from your Supabase project settings (Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Sign up / Sign in** — Email and password authentication
- **Profile** — Add one trusted recommendation per category (plumber, babysitter, dog walker, etc.)
- **Friends** — Search by email, send/accept friend requests
- **Home** — Browse categories to see friends' recommendations
- **Saved** — Bookmark recommendations from friends

## Navigation

| Tab | Purpose |
|-----|---------|
| Home | Category-first discovery of friends' recommendations |
| Friends | Manage connections and view friend profiles |
| Saved | Personal shortlist of bookmarked providers |
| Profile | Your curated list of trusted people |

## Design

Clean, calm, mobile-first UI with soft neutrals, rounded cards, and generous whitespace. No feeds, comments, reviews, messaging, or booking.

## Progressive Web App (PWA)

WOM can be installed on iPhone, Android, and desktop home screens. The website itself is unchanged — PWA adds a manifest, service worker, icons, and optional install prompts.

See **[docs/PWA.md](docs/PWA.md)** for setup, testing, and deployment details.

Quick commands:

```bash
npm run build          # Generates service worker (production only)
npm run generate:pwa-icons  # Regenerate icons from public/favicon.svg
```
