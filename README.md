# Word of Mouth (WOM)

Find the people your people trust.

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
