# BMFC World Cup Predictor 2026

A premium full-stack football predictions game for the 2026 FIFA World Cup. Users sign up with a username and 4-digit passcode, predict scores for every fixture, and compete on a global leaderboard.

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS + Framer Motion
- **Backend:** Supabase (PostgreSQL, RLS, Realtime)
- **Deployment:** Vercel

## Setup

### 1. Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration in the SQL Editor:
   ```
   supabase/migrations/001_schema.sql
   ```
3. Run the seed data:
   ```
   supabase/seed.sql
   ```
4. Enable Realtime for the `users` and `predictions` tables (Database → Replication)
5. Copy your project URL and anon key

### 2. Environment

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Logo

Replace `public/logo.png` with your BMFC club logo. A fallback SVG is included at `public/logo.svg`.

### 4. Install & Run

```bash
npm install
npm run dev
```

### 5. Admin Account

Create a regular account via signup, then in Supabase SQL Editor:

```sql
UPDATE users SET is_admin = true WHERE username = 'your_username';
```

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. Deploy

## Scoring

| Prediction | Points |
|---|---|
| Exact score | 10 |
| Correct result (win/draw/loss) | 5 |
| Wrong | 0 |

## Game Day Flow

1. Admin opens Game Day 1 (pre-seeded as open)
2. Users submit predictions before each fixture kickoff
3. Fixtures auto-lock at kickoff time
4. Admin enters results → points calculated automatically
5. Admin marks game day complete → next game day can be opened

## Project Structure

```
src/
  components/   # UI, auth, match, leaderboard, admin
  pages/        # Route pages
  hooks/        # useAuth, usePredictions, useLeaderboard
  lib/          # Supabase client, scoring, fixtures
  types/        # TypeScript interfaces
supabase/
  migrations/   # Database schema + RPC functions
  seed.sql      # 104 fixtures + 8 game days
```
