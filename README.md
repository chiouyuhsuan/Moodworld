# MoodWorld

One tap a day. Vote today's mood, see how the whole world is feeling — happiest/toughest places, mood by age, trends over time.

This is a full working implementation of the `design_handoff_moodworld` spec: Next.js (App Router) frontend recreating the hi-fi prototype pixel-for-pixel, plus real API routes + PostgreSQL backend (no more localStorage — every vote is a real row, shared by every visitor worldwide).

**Status:** code-complete and type-checked (`tsc --noEmit` passes clean). Not yet deployed to a public URL — follow the steps below to put it online. The full production build (`next build`) could not be verified inside this sandbox specifically because the sandbox's container crashes (SIGBUS) when loading Next.js's native SWC binary — a sandbox limitation, not a bug in this code. It will build normally on Vercel or any normal machine (`npm run build` on your own laptop, or just deploy — Vercel's build step will confirm it).

## What's here

- `src/app/page.tsx` + `src/components/*` — the 5 screens (Vote / Global / Ages / Trends / Give), ported faithfully from the design tokens in the original handoff.
- `src/app/api/**` — the REST API (`/api/vote`, `/api/vote/today`, `/api/stats/global|ages|distribution|trend`, `/api/give/summary`, `/api/give/ad-watched`).
- `db/schema.sql`, `db/seed.sql` — Postgres schema + reference data (30 countries/continents, 7 age ranges).
- `public/manifest.webmanifest`, `public/sw.js` — installable PWA (Add to Home Screen) + minimal offline app-shell caching.
- **Give tab ships as "Coming soon"** — the watch-an-ad button is disabled with a badge. There's no real ad SDK integrated yet (that requires signing up with an ad network and getting approved), so nothing fake is credited. Wire up a real rewarded-video SDK later and flip `src/app/api/give/ad-watched/route.ts` from its current 501 stub to the real thing.

## 1. Create the database (Supabase, free tier)

1. Go to supabase.com → New project. Pick any name/region, save the database password somewhere.
2. Once it's provisioned, open **SQL Editor** → paste the contents of `db/schema.sql` → Run. Then paste `db/seed.sql` → Run.
3. Go to **Project Settings → Database → Connection string** → copy the **Connection pooling** URI (port `6543`, this is the one that works from serverless functions like Vercel). It looks like:
   `postgres://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres`

## 2. Push to GitHub

```bash
cd moodworld
git init
git add -A
git commit -m "MoodWorld: initial implementation"
gh repo create moodworld --public --source=. --push
# (or create an empty repo on github.com and `git remote add origin ... && git push -u origin main`)
```

## 3. Deploy to Vercel (free tier)

1. Go to vercel.com → **Add New → Project** → import the `moodworld` GitHub repo.
2. Framework preset: Next.js (auto-detected). Leave build command as default (`next build`).
3. **Environment Variables** → add:
   - `DATABASE_URL` = the Supabase connection-pooling URI from step 1
   - `GIVE_MONTHLY_GOAL` = `75000` (optional, has a default)
   - `GIVE_DONATED_PCT` = `65`, `GIVE_OPS_PCT` = `35` (optional)
4. Deploy. You'll get a `https://moodworld-xxxx.vercel.app` URL — that's your live site.
5. Optional: add a custom domain under **Project → Settings → Domains**.

## 4. Verify it's really live

- Open the URL, check in with a mood — then open it again in an incognito window / on your phone and confirm it shows up in **Global**.
- Try voting twice in one day from the same browser — the second attempt should show you're already checked in (soft one-vote-per-day, enforced server-side by `(fingerprint, date)`).

## 5. Native app (later, optional)

Per `ARCHITECTURE.md` in the original handoff: wrap this same web frontend with **Capacitor** for iOS/Android so it hits the same API and shares the same data automatically. Don't build a second backend.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL (can point at a local Postgres or your Supabase dev branch)
npm run db:migrate           # applies db/schema.sql
npm run db:seed              # applies db/seed.sql
npm run dev                  # http://localhost:3000
```
