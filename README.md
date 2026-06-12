# BMFC World Cup Predictor 2026

A football predictions game for the 2026 FIFA World Cup. Users sign up with a username and 4-digit passcode, predict scores for every fixture, and compete on a leaderboard.

Built for the BMFC team — sign-up is open, but access is shared privately within the group.

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS + Framer Motion
- **Backend:** Supabase (PostgreSQL, RLS, RPCs)
- **Deployment:** Vercel (SPA + serverless API routes + cron)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run **all migrations in order** in the SQL Editor (Supabase → SQL → New query):

   | Order | File |
   |------:|------|
   | 1 | `supabase/migrations/001_schema.sql` |
   | 2 | `supabase/migrations/002_game_day_cutoff.sql` |
   | 3 | `supabase/migrations/003_api_sync.sql` |
   | 4 | `supabase/migrations/005_auto_progression.sql` |
   | 5 | `supabase/migrations/006_admin_predictions_audit.sql` |
   | 6 | `supabase/migrations/007_user_paid.sql` |
   | 7 | `supabase/migrations/008_restrict_predictions_rls.sql` |
   | 8 | `supabase/migrations/009_admin_delete_user.sql` |
   | 9 | `supabase/migrations/010_user_session_has_paid.sql` |
   | 10 | `supabase/migrations/011_matchday_recap.sql` |

   There is no `004` migration — the gap is normal.

3. Run the seed data:

   ```
   supabase/seed.sql
   ```

4. Enable **Realtime** on `users`, `fixtures`, and `predictions` (Database → Replication) so points update live after each match.

5. Copy your project URL, anon key, and service role key from Project Settings → API.

### 2. Environment (local)

```bash
cp .env.example .env
```

Fill in `.env` using `.env.example` as the template. At minimum for local dev:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For API sync and cron routes locally, also add the server-side variables (see Deployment below).

### 3. Logo

Replace `public/logo.png` with your BMFC club logo. A fallback SVG is at `public/logo.svg`.

### 4. Install & run

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build   # production build
npm run lint    # ESLint
npm run test    # unit tests in watch mode
npm run test:ci # run tests once (used by CI)
npm run preview # preview production build
```

### 5. Admin account

Sign up normally, then in the SQL Editor:

```sql
UPDATE users SET is_admin = true WHERE username = 'your_username';
```

---

## Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add **all** environment variables below in Project Settings → Environment Variables.
3. Deploy. Vercel will pick up `vercel.json` for SPA rewrites and cron schedules.

### Environment variables

Copy from `.env.example`. Use the same values for Preview and Production unless you use separate Supabase projects.

| Variable | Where it runs | Required |
|----------|---------------|----------|
| `VITE_SUPABASE_URL` | Browser (build + runtime) | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Browser (build + runtime) | ✅ |
| `SUPABASE_URL` | API routes / cron | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | API routes / cron | ✅ |
| `API_FOOTBALL_KEY` | Result sync | ✅ if using live sync |
| `API_FOOTBALL_BASE_URL` | Result sync | ✅ |
| `API_FOOTBALL_LEAGUE` | Result sync | ✅ |
| `API_FOOTBALL_SEASON` | Result sync | ✅ (`2026` for World Cup) |

**API-Football plan:** The free tier only covers seasons **2022–2024**. World Cup **2026** live sync needs a [paid API-Sports plan](https://www.api-football.com/pricing). Without it, use **Admin → Technical → Manual Result Entry** after each game (points still update live on The Table).
| `CRON_SECRET` | Cron auth | ✅ (recommended) |

**Important:** Never prefix server secrets with `VITE_` — those are embedded in the client bundle.

If the site loads, sign-in works, and the admin sync panel runs, your Vercel env is likely set up correctly. Cron jobs need `CRON_SECRET` plus the Supabase service role key to sync results automatically.

### Cron jobs (automatic)

Configured in `vercel.json`:

- **`/api/sync-results`** — every 10 minutes (pulls scores from API-Football)
- **`/api/process-progression`** — every 5 minutes (knockout placeholder updates)

---

## Scoring

| Prediction | Points |
|------------|--------|
| Exact score | 10 |
| Correct result (win / draw / loss) | 5 |
| Wrong | 0 |

---

## Matchday flow

1. Admin opens a matchday (Game Day 1 is pre-seeded as open in `seed.sql`).
2. Users enter scores for each fixture, then tap **Submit prediction** on each match.
3. Draft scores auto-save in the background; submission is the explicit confirm step.
4. **All fixtures on a matchday lock together** — one hour before the **earliest kickoff** on that matchday (not per individual match).
5. Results sync via API-Football (cron) or admin entry → points calculated automatically.
6. When every fixture on a matchday is complete, auto-progression can advance knockout placeholders and complete the matchday.
7. After a matchday completes, users see a **one-time recap modal** on the dashboard (points, rank, table position).

---

## Project structure

```
src/
  components/   # UI, auth, match, leaderboard, admin, dashboard
  pages/        # Route pages
  hooks/        # useAuth, usePredictions, useLeaderboard, useMatchdayRecap
  lib/          # Supabase client, scoring, fixtures, haptics
  types/        # TypeScript interfaces
api/            # Vercel serverless routes (sync, progression)
supabase/
  migrations/   # Database schema + RPC functions (run in order)
  seed.sql      # 104 fixtures + 8 game days
```
