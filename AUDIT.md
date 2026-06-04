# BMFC World Cup Predictor — Pre-Launch Audit

**Audit date:** 4 June 2026  
**Scope:** Full codebase (read-only)  
**Build verified:** `npm run build` succeeds — 636.55 kB JS (188.73 kB gzip), 39.45 kB CSS

---

## 1. Code Quality & Architecture

**Score: 58 / 100**  
**Rating: Requires Improvement**

### Strengths
- Clear separation: `pages/`, `components/`, `hooks/`, `lib/`, `api/` with typed Supabase RPC boundaries (`src/types/index.ts`).
- TypeScript strict mode enabled with unused-local checks (`tsconfig.app.json` lines 15–18).
- Business logic for scoring and cutoffs centralised in SQL RPCs and mirrored in `src/lib/scoring.ts`.
- Admin surface decomposed into focused components (`AdminSection.tsx`, `SyncStatusCard.tsx`, etc.).

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | `src/components/match/GameDayPanel.tsx:89–92` | **Dead UI branch:** `CutoffCountdown` is rendered only when `gameDay.status === 'open' && !isCurrent`, but this block sits inside `if (isCurrent)`. The countdown never renders for the active matchday. |
| Medium | `src/main.ts`, `src/counter.ts`, `src/style.css` | Vite scaffold leftovers — not referenced by `index.html` (which loads `src/main.tsx:19`). Dead weight and confusion for contributors. |
| Medium | `src/components/match/PicksProgressBar.tsx` | Entire component is unused — no imports anywhere in `src/`. |
| Medium | `src/lib/scoring.ts:18–32` | `isFixtureLocked()` is defined but never called anywhere in `src/`. |
| Medium | `src/App.tsx:4–10` | All routes eagerly imported — no `React.lazy` / `Suspense`. Contributes to 636 kB single chunk. |
| Medium | `vite.config.ts:4–6` | Bare config — no manual chunks, no bundle analysis, no alias paths. |
| Medium | `README.md:74–80` vs `supabase/migrations/002_game_day_cutoff.sql:3–8` | Documentation describes per-fixture kickoff locking; implementation locks entire matchday 1 hour before earliest kickoff. Docs and code diverge. |
| Low | `src/hooks/usePredictions.ts:125` | Accuracy calculation uses flawed denominator: `completedPredictions` treats any user with predictions as "completed" when `points_awarded === 0` is ambiguous for unscored fixtures. |
| Low | `src/hooks/useAuth.tsx:101–104` | `logout()` clears localStorage only — no server-side session invalidation RPC. |
| Low | Naming inconsistency | "Login" (`LoginForm.tsx:70`), "Sign Up" (`SignupForm.tsx:108`, `Landing.tsx:448`) vs "Sign up" elsewhere — mixed casing and verb forms. |

### Component structure assessment
Architecture is sound for a small app (~54 TS/TSX files) but lacks route-level code splitting, has orphaned scaffold files, and one confirmed render-logic bug in a core matchday component.

---

## 2. Security

**Score: 35 / 100**  
**Rating: Inadequate**

### Strengths
- Server secrets correctly excluded from `VITE_` prefix (`.env.example:5–7`, `src/vite-env.d.ts:4–5` only exposes Supabase URL + anon key).
- Service role used only in server code (`api/lib/supabaseAdmin.ts:9–12`).
- Admin RPCs verify `is_admin` + `session_token` before acting (`001_schema.sql:274–276`, `308–310`, etc.).
- Cron endpoints require `Authorization: Bearer ${CRON_SECRET}` when secret is set (`api/sync-results.ts:8–14`, `api/process-progression.ts:8–14`).
- Direct table writes blocked by RLS (`001_schema.sql:411–416`).

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| **Critical** | `supabase/migrations/001_schema.sql:408` | `CREATE POLICY "Predictions readable" ON predictions FOR SELECT USING (true)` — **anyone with the anon key can read every user's predictions** before results are public. Trivial IDOR/spoiler vector via `supabase.from('predictions').select('*')`. |
| **Critical** | `001_schema.sql:150–152`, `368–370` | 4-digit numeric passcode (`^\d{4}$`) — ~10,000 combinations, brute-forceable in minutes. |
| **Critical** | `001_schema.sql:180–208` | `login_user` has no rate limiting, lockout, or CAPTCHA. Unlimited credential attempts via public RPC (`GRANT` at line 420). |
| High | `src/hooks/useAuth.tsx:20–35`, `101–104` | Session stored in `localStorage` (`bmfc_session`). XSS on any page would exfiltrate tokens. Logout does not invalidate server token. |
| High | `001_schema.sql:372–374` | `reset_user_passcode` updates hash but **does not rotate or clear `session_token`** — old sessions remain valid after passcode reset. |
| High | `api/sync-results.ts:35–38`, `api/process-progression.ts:35–38` | Development bypass: if `NODE_ENV=development` and `CRON_SECRET` unset, cron endpoints accept unauthenticated GET. Safe on Vercel production but dangerous if misconfigured locally or on preview deploys. |
| Medium | `001_schema.sql:405` | `users` table SELECT blocked (`USING (false)`) — good — but `leaderboard_stats` view (`001_schema.sql:67–76`) exposes `display_name` and points publicly (intended). |
| Medium | `003_api_sync.sql:22–25`, `005_auto_progression.sql:25–28` | RLS enabled on `api_request_log`, `fixture_api_mapping`, `progression_log`, `progression_queue` with no public policies — correct, service-role only. |
| Low | `src/lib/devBypass.ts:23–25` | Dev bypass gated on `import.meta.env.DEV` — must never ship a production build with bypass enabled (currently safe). |
| Low | `src/App.tsx:14–29` | Admin route protection is client-side only (`adminOnly` prop). Acceptable because all admin mutations go through RPC auth checks, but `/admin` UI shell is briefly visible if RPC calls fail. |

### Session token handling
Tokens are 32-byte hex (`001_schema.sql:196`), rotated on login — good. Stored client-side indefinitely until next login — bad. No `logout_user` RPC exists.

---

## 3. Performance

**Score: 52 / 100**  
**Rating: Requires Improvement**

### Build output
```
dist/assets/index-DeECQlIg.js   636.55 kB │ gzip: 188.73 kB  ⚠ exceeds 500 kB warning
dist/assets/index-DvQ-3SUA.css   39.45 kB │ gzip:   7.72 kB
```

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | `src/App.tsx:4–10`, `vite.config.ts` | No route-based code splitting. Admin, Landing canvas, and leaderboard all ship in one bundle. |
| Medium | `index.html:14` | Three Google Font families loaded (Figtree, Inter, JetBrains Mono) — ~blocking render; no `font-display` subset or self-hosting. |
| Medium | `src/pages/Landing.tsx:44–294` | Hero canvas runs continuous `requestAnimationFrame` loop. Mitigated by `visibilitychange` pause (lines 130–135, 278–292) but still CPU-heavy on mobile during landing visit. |
| Medium | `src/components/match/MatchCard.tsx` | No `React.memo` — re-renders all cards when any prediction state changes on dashboard. |
| Low | `src/components/match/CountryFlag.tsx:37–47` | External flag images from `flagcdn.com` with `loading="lazy"` — good — but no width/height attributes (minor CLS). |
| Low | `src/hooks/useLeaderboard.ts:53–65` | Realtime subscription on `users` + `predictions` triggers full reload — acceptable at BMFC scale but not debounced. |
| Positive | `src/components/match/CountryFlag.tsx:42–43` | `loading="lazy"` and `decoding="async"` on flag images. |
| Positive | `src/hooks/useLeaderboard.ts:63–65`, `SyncStatusCard.tsx:105` | Realtime channels cleaned up on unmount. |

---

## 4. Accessibility

**Score: 40 / 100**  
**Rating: Inadequate**

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | Entire app | **No skip navigation link** to main content. |
| High | `src/components/auth/LoginForm.tsx:52`, `SignupForm.tsx:74–98` | `<label>` elements lack `htmlFor` / associated `id` on inputs — screen readers won't connect labels. |
| High | `src/components/auth/PinInput.tsx:75–101` | Four separate inputs with no `aria-label` (e.g. "Passcode digit 1 of 4"), no `role="group"`, no group label. |
| High | `src/components/match/ScoreInput.tsx:12–40` | Score inputs have no accessible name — no `aria-label` like "Home score for Mexico". |
| Medium | `src/components/match/MatchCard.tsx:200–208` | Submit button lacks `aria-describedby` linking to validation/error state. |
| Medium | `src/components/match/MatchCard.tsx:158–160`, `180–182` | Status communicated via colour + emoji ("🔒 Locked") without screen-reader-only text in all cases. |
| Medium | `src/pages/Landing.tsx:485–486` | Decorative emoji in "How it works" cards marked `aria-hidden` — good — but many other emoji status indicators across match cards are not. |
| Low | `src/components/dashboard/DashboardStatusBanner.tsx:151–152` | `role="status"` + `aria-live="polite"` on banner — good pattern, but countdown digits not announced as a live region with remaining time semantics. |
| Low | `src/components/ui/MobileBottomNav.tsx:131–145` | Tab buttons lack `aria-current="page"` on active route. |
| Positive | `src/components/ui/MobileBottomNav.tsx:7` | Nav icons correctly `aria-hidden`. |
| Positive | `src/components/admin/AdminSection.tsx` | Expandable sections use button semantics (verify in component — pattern present). |

### Touch targets
Most buttons use `min-h-[48px]` (`index.css:74`, `MatchCard.tsx:205`) — meets 44px guideline. Pin inputs at 52px (`PinInput.tsx:95`) — adequate.

### Colour contrast
Brand navy `#0D1B4B` on white passes WCAG AA. Gray-500 `#6B7280` body text on `#F0F4FF` background likely passes AA for normal text but gold `#D4A017` on white for small text may fail AA for small sizes — not formally tested.

---

## 5. User Experience

**Score: 64 / 100**  
**Rating: Requires Improvement**

### Strengths
- Clear primary flow: Landing → Signup → Dashboard → Submit predictions → Leaderboard.
- Skeleton loading on dashboard (`Dashboard.tsx:94–98`).
- Status banner with urgency states and countdown (`DashboardStatusBanner.tsx:27–41, 148–197`).
- Toast feedback on auth (`LoginForm.tsx:18–31`).
- Mobile bottom nav for authenticated users (`MobileBottomNav.tsx`).
- Haptic feedback on confirm (`MatchCard.tsx:101`, `lib/haptics.ts`).

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | `src/pages/Dashboard.tsx:77` | Subtitle says "Enter your predictions **before each match kicks off**" — incorrect; matchday locks 1 hour before **first** kickoff (`002_game_day_cutoff.sql:3–8`). |
| High | `src/pages/Landing.tsx:335–340` | "How it works" card 2: "Submit your predictions before **the match starts**. Once it kicks off, they're locked." — wrong rule; contradicts `getGameDayCutoff()` in `src/lib/scoring.ts:41–46`. |
| Medium | `src/pages/Dashboard.tsx:111–113` + `DashboardStatusBanner.tsx:126–131` | Duplicate empty state when no matchday open — banner AND card both say "No matchday is currently open." |
| Medium | Entire app | **No onboarding** — new users land on dashboard with no explanation of matchday lock rules or two-step predict-then-submit flow. |
| Medium | `src/components/match/MatchCard.tsx:56–79` | Auto-save draft after 700ms may confuse users who expect explicit submit only — draft saves to DB before "Submit prediction" click. |
| Low | `src/pages/Leaderboard.tsx:44` | "Sign up to join The Table" — inconsistent capitalisation of "The Table". |
| Low | `src/App.tsx:82–97` | Toasts lack configurable duration; no `aria-live` integration for screen readers. |
| Positive | `src/components/match/MatchCard.tsx:200–208` | Explicit "Submit prediction" step after score entry — good confirmation pattern. |

---

## 6. Data Integrity & Business Logic

**Score: 70 / 100**  
**Rating: Requires Improvement**

### Scoring logic — correct
```sql
-- 001_schema.sql:97–103
IF pred_home = actual_home AND pred_away = actual_away THEN RETURN 10;
ELSIF get_result_direction(...) = get_result_direction(...) THEN RETURN 5;
ELSE RETURN 0;
```
Client mirror in `src/lib/scoring.ts:7–15` matches. Dev mock data confirms 10/5/0 (`devBypass.ts:176–212`).

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | `api/lib/syncResults.ts:6`, `250–251` | API sync scores using `goals.home/away` for FT, AET, and PEN. For knockout matches decided on penalties, users may expect full-time score or penalty result — **business rule undocumented and may disagree with player expectations**. |
| High | `001_schema.sql:298–328` | `complete_game_day` marks day complete but **does not enqueue `progression_queue`** — only `auto_complete_matchday` in `005_auto_progression.sql:47–78` does. Manual admin completion skips auto-progression. |
| Medium | `002_game_day_cutoff.sql:55–66` vs `001_schema.sql:381–389` | `lock_expired_fixtures()` replaced to use matchday cutoff (002) — correct — but 001's per-kickoff version is overwritten. Frontend `isFixtureLocked()` still references per-fixture kickoff as fallback (`scoring.ts:30–31`) if called without gameDay context. |
| Medium | `src/pages/Dashboard.tsx:77`, `README.md:77–78` | User-facing copy describes per-fixture lock — **logic/copy mismatch** risks users missing the real cutoff. |
| Low | `001_schema.sql:52–53` | DB enforces `predicted_home/away` between 0–99. RPC does not explicitly validate before insert (relies on CHECK constraint — will error opaquely). |
| Low | Draws | Handled correctly via `get_result_direction` returning `'draw'`. |
| Positive | `002_game_day_cutoff.sql:36–40` | Cutoff enforced server-side in `submit_prediction` — cannot bypass via client. |
| Positive | `005_auto_progression.sql:30–44` | `check_matchday_complete` verifies all fixtures in game_day are completed before auto-progression. |

### Fixture grouping
Fixtures correctly keyed by `game_day` (`001_schema.sql:29–46`, `seed.sql:14+`). Seed contains **104 fixtures** across **8 game days** (`seed.sql:4–12`, 104 INSERT rows).

---

## 7. API Integration

**Score: 55 / 100**  
**Rating: Requires Improvement**

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | `vercel.json:4–5`, `api/lib/syncResults.ts:5` | Cron runs `*/15 * * * *` = **96 invocations/day**; `MAX_DAILY_REQUESTS = 80`. During active tournament days, limit will be hit and sync will skip (`syncResults.ts:201–212`) — potentially missing late results. |
| High | `api/lib/syncResults.ts:180–185`, `api/lib/processProgression.ts:65–70` | **No HTTP retry** on API-Football fetch failures — single `fetch`, throw on non-OK. |
| Medium | `api/lib/syncResults.ts:50–55` | `utcDayBounds()` uses UTC midnight boundaries — fixtures near timezone boundaries may mismatch local kickoff dates. |
| Medium | `api/lib/syncResults.ts:14–21` | Team alias map has only 6 entries — unusual API spellings may fail to match (`teamsMatch` at lines 39–47 uses substring heuristics as fallback). |
| Medium | `api/lib/processProgression.ts:166–170` | Knockout placeholder matching uses kickoff within 2 hours only — no team name validation (intentional for placeholders, but order-dependent). |
| Low | `api/lib/syncResults.ts:215–229` | Idle skip when no active fixtures — saves quota but may miss delayed/postponed matches outside 3-hour window (`141–166`). |
| Positive | `api/lib/syncResults.ts:66–116` | Fixture mapping table with 6-hour kickoff tolerance and persistent `fixture_api_mapping`. |
| Positive | `api/lib/processProgression.ts:199–226` | Knockout auto-discovery with retry scheduling (`RETRY_MINUTES = 30`). |

---

## 8. Database & Supabase

**Score: 64 / 100**  
**Rating: Requires Improvement**

### Schema overview
| Table | RLS | Public read | Notes |
|-------|-----|-------------|-------|
| `users` | ✅ | ❌ | Correct |
| `fixtures` | ✅ | ✅ | Intended |
| `game_days` | ✅ | ✅ | Intended |
| `predictions` | ✅ | **✅ ALL ROWS** | **Privacy bug** |
| `api_request_log` | ✅ | ❌ | Service role only |
| `fixture_api_mapping` | ✅ | ❌ | Service role only |
| `progression_log/queue` | ✅ | ❌ | Service role only |

### Migrations
| File | Status |
|------|--------|
| `001_schema.sql` | Core schema + RPCs |
| `002_game_day_cutoff.sql` | Matchday cutoff override |
| `003_api_sync.sql` | API sync tables |
| **004** | **Missing — gap in sequence** |
| `005_auto_progression.sql` | Auto progression + knockout |
| `006_admin_predictions_audit.sql` | Admin audit RPC |
| `007_user_paid.sql` | Payment tracking |

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | `README.md:16–18` | Setup instructs running **only** `001_schema.sql` — migrations 002–007 will be missing on fresh deploys following docs. |
| Medium | `001_schema.sql:60–64` | Indexes on `game_day`, `kickoff_utc`, `user_id`, `fixture_id`, `total_points` — adequate for expected scale. No composite index on `(game_day, status)` for progression checks. |
| Medium | `001_schema.sql:67–76` | `leaderboard_stats` view — correct aggregation; depends on `total_points` denormalisation updated by `recalculate_user_points`. |
| Low | `003_api_sync.sql:27` | Realtime enabled on `api_request_log` only — README says enable on `users` and `predictions` (`README.md:24`) for leaderboard; partially configured. |
| Positive | `supabase/seed.sql` | 104 fixtures, 8 game days, MD1 pre-opened — matches README claim (`README.md:93`). |

### RPC grants
Admin RPCs correctly granted to `anon, authenticated` with internal auth checks. Service-only functions (`auto_complete_matchday`, `increment_api_request_log`) granted to `service_role` only (`005_auto_progression.sql:158–161`, `003_api_sync.sql:138–140`).

---

## 9. Testing & Reliability

**Score: 12 / 100**  
**Rating: Inadequate**

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| **Critical** | Entire repo | **Zero test files** — no `*.test.ts`, `*.spec.ts`, or e2e suite. |
| High | No `.github/workflows/` | No CI pipeline — lint, typecheck, and build not enforced on PRs. |
| Medium | `src/components/ui/ErrorBoundary.tsx` | Used on Dashboard, Leaderboard, Admin, PreviousPredictions — **not** wrapping `App.tsx` root or auth pages. |
| Medium | Critical paths untested | Scoring RPC, cutoff enforcement, API sync matching, progression queue — all unverified by automation. |
| Low | `package.json:6–10` | Scripts: `dev`, `build`, `lint`, `preview` — no `test` script. |
| Positive | `npm run build` | TypeScript + Vite build passes (verified during audit). |
| High | `npm run lint` (exit 1) | **3 ESLint errors, 3 warnings** — see addendum below. |

### ESLint results (`npm run lint`)

| Severity | File | Line | Rule | Issue |
|----------|------|------|------|-------|
| Error | `src/components/ui/PageBackground.tsx` | 10 | `react-hooks/rules-of-hooks` | `useAuth()` called inside `try/catch` — conditional hook call; can crash or behave unpredictably. |
| Error | `src/components/match/CountryFlag.tsx` | 13 | `@typescript-eslint/no-unused-vars` | `_flag` prop destructured but never used. |
| Error | `src/lib/devBypass.ts` | 106 | `prefer-const` | `devPredictions` should be `const`. |
| Warning | `src/pages/Admin.tsx` | 67 | `react-hooks/exhaustive-deps` | `useEffect` missing `load` dependency. |
| Warning | `src/hooks/useAuth.tsx` | 120 | `react-refresh/only-export-components` | Hook file also exports non-component helpers. |
| Warning | (component file) | 78 | `react-refresh/only-export-components` | Same fast-refresh warning in a component module. |

---

## 10. DevOps & Deployment

**Score: 48 / 100**  
**Rating: Inadequate**

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | `README.md:63` | Vercel deployment docs list only 2 env vars — **missing** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `API_FOOTBALL_*`, `CRON_SECRET` (all required for cron/API features). |
| High | `.env.example:1–16` | Complete env template exists but README doesn't reference it for deployment. |
| Medium | `vercel.json:1–15` | Cron jobs configured for sync (15 min) and progression (5 min) — good — but auth depends on operator setting `CRON_SECRET`. |
| Medium | Entire app | **No error monitoring** (Sentry, LogRocket, etc.) — only `console.error` in API handlers (`api/sync-results.ts:61`). |
| Medium | No CI | Build stability relies on manual `npm run build` — no automated gate. |
| Low | Vercel | Standard SPA rewrite + API routes — rollback via Vercel deployment history (platform default). |
| Positive | `.env.example:5–6` | Explicit comment: "NEVER use VITE_ prefix" for service role key. |

### Environment variable checklist
| Variable | Client | Required for launch |
|----------|--------|---------------------|
| `VITE_SUPABASE_URL` | ✅ | ✅ |
| `VITE_SUPABASE_ANON_KEY` | ✅ | ✅ |
| `SUPABASE_URL` | Server | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | ✅ |
| `API_FOOTBALL_KEY` | Server | ✅ (if using sync) |
| `API_FOOTBALL_BASE_URL` | Server | ✅ |
| `API_FOOTBALL_LEAGUE` | Server | ✅ |
| `API_FOOTBALL_SEASON` | Server | ✅ |
| `CRON_SECRET` | Server | ✅ |

---

## 11. UI & Design Consistency

**Score: 76 / 100**  
**Rating: Good**

### Strengths
- Cohesive brand palette in `tailwind.config.js:7–13` — blue, gold, navy, light — used consistently.
- Typography system: Figtree display, Inter body, JetBrains Mono for scores/passcodes (`tailwind.config.js:15–18`, `index.html:14`).
- Reusable primitives: `glass-card`, `btn-primary`, `btn-secondary`, `input-field` (`src/index.css`).
- Admin sections share `AdminSection.tsx` + `admin-inner-card` styling — recent improvement.
- Responsive patterns: mobile bottom nav, `sm:` breakpoints, abbreviated team names on small screens (`CountryFlag.tsx:57–61`).
- Framer Motion used sparingly: landing fade-ups, pin input scale, game day expand (`Landing.tsx:384–392`, `PinInput.tsx:92–93`, `GameDayPanel.tsx:125–133`).

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| Low | Entire app | No dark/light mode toggle — light only (acceptable for v1). |
| Low | `src/pages/Landing.tsx:448–454` | "Sign Up" vs "Login" button labels — inconsistent with sentence-case "Sign up" used in body copy elsewhere. |
| Low | `src/style.css` | Orphaned Vite default styles — not imported, but confusing if discovered. |
| Low | `src/components/leaderboard/Leaderboard.tsx:3` | Framer Motion springs on leaderboard — minor animation inconsistency vs CSS transitions elsewhere. |

---

## 12. Copy & Content

**Score: 66 / 100**  
**Rating: Requires Improvement**

### Strengths
- Tone largely shifted from gamified/American to plain British English: "Submit prediction", "How points work", "Welcome back".
- Error messages are clear: "Invalid username or passcode" (`LoginForm.tsx:31`).
- Empty states mostly helpful: "No matchday is currently open" (`Dashboard.tsx:112`).

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | `src/pages/Landing.tsx:335–340` | **Incorrect lock rule copy** — "before the match starts" / "Once it kicks off" — staccato three-part pattern but factually wrong for matchday cutoff. |
| High | `src/pages/Dashboard.tsx:77` | Same per-fixture kickoff language — contradicts implemented business logic. |
| Medium | `src/pages/Landing.tsx:448`, `Navbar.tsx:95` | "Sign Up" (American title case) vs `SignupForm.tsx:76` "Sign up" — inconsistent. |
| Medium | `LoginForm.tsx:70` | "Login" as verb on button — British style prefers "Log in" (two words). |
| Medium | `src/pages/Landing.tsx:331–347` | Three-card "How it works" section uses emoji headers — tone slightly informal for otherwise restrained voice. |
| Low | `src/components/match/MatchCard.tsx:114–118` | "Draft saved soon…" — ellipsis style acceptable but slightly vague. |
| Low | `COPY.md` | Copy inventory may be **out of sync** with latest UI strings after recent copy pass — not authoritative without re-extraction. |
| Low | `index.html:10` | Meta description uses em dash — fine; "Predict the scores" vs landing "Predict the scoreline" — minor inconsistency. |
| Positive | `src/pages/Landing.tsx:440` | "Predict the scoreline for every fixture and follow your position throughout the tournament." — natural British tone, no Americanisms. |

### Americanisms scan
No instances of "soccer", "favorite", "color" (CSS vars aside), or "guys". Remaining American influence: "Sign Up" casing, "Login" single word, "pts" abbreviation (common in UK football contexts — acceptable).

---

## Overall Assessment

| Metric | Value |
|--------|-------|
| **Overall score** | **54 / 100** |
| **Overall rating** | **Requires Improvement** |

### Category summary

| # | Category | Score | Rating |
|---|----------|------:|--------|
| 1 | Code Quality & Architecture | 58 | Requires Improvement |
| 2 | Security | 35 | Inadequate |
| 3 | Performance | 52 | Requires Improvement |
| 4 | Accessibility | 40 | Inadequate |
| 5 | User Experience | 64 | Requires Improvement |
| 6 | Data Integrity & Business Logic | 70 | Requires Improvement |
| 7 | API Integration | 55 | Requires Improvement |
| 8 | Database & Supabase | 64 | Requires Improvement |
| 9 | Testing & Reliability | 12 | Inadequate |
| 10 | DevOps & Deployment | 48 | Inadequate |
| 11 | UI & Design Consistency | 76 | Good |
| 12 | Copy & Content | 66 | Requires Improvement |

---

## Prioritised Action List

### P1 — Fix before launch

1. **Restrict predictions RLS** — replace `USING (true)` at `001_schema.sql:408` with user-scoped policy or remove direct SELECT access; expose predictions only via authenticated RPC for own user. *Prevents spoiler/IDOR leak.*
2. **Apply all migrations 002–007** on production Supabase — README currently misleads (`README.md:16–18`).
3. **Set all server env vars on Vercel** — especially `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` (`.env.example:7–16`).
4. **Fix lock-timing copy** — `Dashboard.tsx:77`, `Landing.tsx:335–340`, `README.md:77–78` must describe matchday cutoff (1 hour before earliest kickoff), not per-fixture kickoff.
5. **Add login rate limiting** — throttle `login_user` RPC (e.g. per-username lockout after N failures) — `001_schema.sql:180–208`.
6. **Reconcile cron schedule with API quota** — reduce `vercel.json:4` frequency or raise `MAX_DAILY_REQUESTS` in `syncResults.ts:5` / `processProgression.ts:3`; current 96/day exceeds 80 cap.
7. **Invalidate sessions on passcode reset** — clear `session_token` in `reset_user_passcode` (`001_schema.sql:372–374`).
8. **Wire manual `complete_game_day` to progression queue** — or document that admins must rely on auto-complete only (`001_schema.sql:298–328` vs `005_auto_progression.sql:47–78`).

### P2 — Fix within first week

1. **Add unit tests** for `calculate_prediction_points`, `get_game_day_cutoff`, and `submit_prediction` lock enforcement.
2. **Add CI workflow** — `npm run lint`, `npm run build` on every push.
3. **Fix `GameDayPanel.tsx:89–92`** — render `CutoffCountdown` when `isCurrent && status === 'open'`.
4. **Route-level code splitting** — lazy-load Admin and Landing (`App.tsx:4–10`).
5. **Remove dead code** — `src/main.ts`, `src/counter.ts`, `src/style.css`, `PicksProgressBar.tsx`, unused `isFixtureLocked()` (`scoring.ts:18–32`).
6. **Accessibility pass** — skip link, `htmlFor` on all labels, `aria-label` on PinInput and ScoreInput.
7. **Add HTTP retry** with backoff on API-Football fetches (`syncResults.ts:180`, `processProgression.ts:65`).
8. **Server-side logout RPC** — invalidate `session_token` on logout (`useAuth.tsx:101–104`).
9. **Deduplicate dashboard empty state** — show idle message in banner OR card, not both (`Dashboard.tsx:111–113`, `DashboardStatusBanner.tsx:126–131`).
10. **Update README deployment section** to reference `.env.example` and all migrations.

### P3 — Nice to have

1. Font self-hosting / subsetting to reduce render blocking (`index.html:14`).
2. `React.memo` on `MatchCard` and leaderboard rows.
3. Onboarding modal for first-time dashboard visitors.
4. Error monitoring (Sentry) on API routes and React error boundary.
5. Re-extract and maintain `COPY.md` as part of CI.
6. Formal WCAG contrast audit on gold accent text.
7. Bundle analyser + manual chunk config in Vite.
8. E2E test for signup → predict → submit flow.

---

## Summary

The BMFC World Cup Predictor has a solid visual identity and a well-structured React/Supabase architecture with correct core scoring maths, but it is **not ready for a public launch without security fixes**. The most serious issue is that all predictions are publicly readable via the anon key, which destroys the integrity of a predictions game. Authentication is weak (4-digit passcode, no brute-force protection, client-side sessions), documentation understates deployment requirements, and several user-facing texts describe the wrong lock rules. Testing and CI are effectively absent. The UI layer is the strongest part of the project — coherent, responsive, and recently refined — but accessibility and performance optimisations remain incomplete. Address P1 items before inviting real users; treat P2 as the first-week hardening sprint.

---

*End of audit. No code was modified during this review.*
