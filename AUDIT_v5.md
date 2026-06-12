# BMFC World Cup Predictor — Audit v5

> **Current audit (v5)** — supersedes `AUDITNEW.md` (v4).  
> **Last updated:** 11 June 2026 · **Commit:** `01457e9` on `main`

**Scope:** Full codebase + production behaviour from live tournament ops  
**Operator context:** Closed BMFC team app (~10–30 trusted users), private link — **not** a public internet product  
**Build verified:** `npm run build` succeeds — 668 KB JS (198 KB gzip), 46 KB CSS  
**Lint verified:** `npm run lint` — **0 errors**, 1 warning (`AuthProvider.tsx` hook deps)  
**Tests verified:** `npm run test:ci` — **24+ tests** across 5 files (occasional Vitest worker timeout on Windows)

---

## Executive summary

| | |
|---|---|
| **Overall score** | **75 / 100** |
| **Closed-team tournament readiness** | **Ready** — with manual result entry |
| **Public-launch equivalent** | **~61 / 100** |
| **Biggest win since v4** | Live scoring UX, parallel group tabs, admin Ops/Technical split, manual score correction |
| **Biggest operational discovery** | **API-Football free plan does not include World Cup 2026** — automatic sync cannot work without a paid plan |

The app is in good shape for the tournament **if scores are entered manually** after each game. Automatic API sync is correctly implemented in code but **blocked by the API provider tier**, not by the application.

---

## Score history

| Version | Date | Overall | Notes |
|---------|------|--------:|-------|
| v1 | 4 Jun 2026 | 54 | Public-launch framing |
| v2 | 4 Jun 2026 | 59 | RLS, cron, copy fixes |
| v3 | 5 Jun 2026 | 68 | Team-launch framing |
| v4 | 5 Jun 2026 | 71 | Vitest, CI, dead-code cleanup (`AUDITNEW.md`) |
| **v5 (this doc)** | **11 Jun 2026** | **75** | Migrations 012–015, realtime, sync hardening, API plan reality |

---

## Deployment status (operator)

| Item | Status |
|------|--------|
| Supabase migrations 001–011 | ✅ Assumed applied |
| Migrations 012–015 | ⚠️ **Verify** — parallel groups, prize pot, venues, auth repair, realtime |
| Vercel production (`bmfcpredictor.com`) | ✅ Live |
| Vercel env vars (Supabase) | ✅ Site functional |
| API-Football automatic sync | ❌ **Free plan** — seasons 2022–2024 only; WC 2026 needs paid plan |
| Manual result entry | ✅ Primary workflow for tournament |
| Realtime (`015_enable_realtime.sql`) | ✅ Applied (operator confirmed) |
| GitHub Actions CI | ✅ Lint → build → `test:ci` |

**Security posture note:** 4-digit passcode, no login rate limiting, and localStorage sessions are **accepted** for this closed-team deployment.

---

## Changes since audit v4

| Item | Status |
|------|--------|
| Migrations 012–015 | ✅ Added (parallel groups, prize pot, venue typos, auth repair, realtime) |
| Parallel group-stage predictions | ✅ `GroupMatchdayTabs.tsx`, `012_parallel_group_predictions.sql` |
| Live per-fixture points | ✅ Realtime + 30–60s polling on leaderboard, predictions, auth |
| API routes | ✅ Converted to `@vercel/node` (fixed Vercel `FUNCTION_INVOCATION_FAILED`) |
| Sync pipeline rewrite | ✅ DB-first matching, `score.fulltime`, season snapshot, plan-error skip |
| Admin split | ✅ `AdminOperations.tsx` + `AdminTechnical.tsx` |
| Manual score correction | ✅ “Scored results” filter + Update button |
| API plan documentation | ✅ README, `.env.example`, admin warning in `SyncStatusCard` |
| Prize pot | ✅ `012_prize_pot_stats.sql`, `PrizePotBanner.tsx`, tests |
| Cron schedule | Changed to `*/10` (was `*/20` in v4) — reopens API quota tension |

---

## 1. Architecture & code organization

**Score: 77 / 100**  
**Rating: Good**

### Strengths
- Clear layers: `pages/`, `components/`, `hooks/`, `lib/`, `api/`
- Business rules in Supabase RPCs; client mirrors for UX (`src/lib/scoring.ts`)
- Auth split: `AuthProvider.tsx`, `authContext.ts`, `useAuth.ts`
- Admin split: Ops vs Technical with `AdminNav.tsx`
- Shared `useAdminData.ts`
- API: `@vercel/node` + `adminAuth.ts`, `apiResponse.ts`, `parseApiResponse.ts`

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| Medium | `src/App.tsx` | No route lazy-loading — single ~668 KB chunk |
| Low | `src/lib/devBypass.ts` | Dev bypass adds complexity |
| Low | `src/hooks/AuthProvider.tsx:74` | ESLint `exhaustive-deps` warning |
| Positive | `api/lib/syncResults.ts` | DB-first season snapshot matching |

---

## 2. Security

**Score: 71 / 100**  
**Rating: Adequate for closed-team use** (~48/100 if public)

### Strengths
- Predictions privacy (`008_restrict_predictions_rls.sql`)
- Users table blocked; session RPCs only
- Admin RPCs verify `is_admin` + `session_token`
- Cron: `CRON_SECRET`; manual sync: admin POST credentials
- Service role confined to `api/`
- No `VITE_` on server secrets
- Prize pot aggregate-only RPC

### Findings (accepted for BMFC)

| Severity | Location | Issue |
|----------|----------|-------|
| Info | `001_schema.sql` | 4-digit passcode |
| Info | `login_user` RPC | No rate limiting |
| Info | `AuthProvider.tsx` | Session in localStorage |
| Info | `reset_user_passcode` | Does not invalidate sessions |
| Low | `api/lib/adminAuth.ts` | Dev bypass in development without `CRON_SECRET` |

---

## 3. Database schema & migrations

**Score: 85 / 100**  
**Rating: Strong**

### Strengths
- 15 migrations, rich RPC layer
- Per-fixture scoring via `score_fixture` (supports re-score on correction)
- Matchday cutoff 1h before earliest kickoff (`002_game_day_cutoff.sql`)
- API sync, progression queue, audit RPCs
- Parallel group openings (`012_parallel_group_predictions.sql`)
- Realtime publication (`015_enable_realtime.sql`)

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| Medium | `012_prize_pot_stats.sql` + `012_parallel_group_predictions.sql` | Two `012_*` files — ambiguous order for fresh installs |
| Medium | `complete_game_day` vs `auto_complete_matchday` | Manual complete does not enqueue knockout progression |
| Low | `013_fix_group_venue_typos.sql` | Data patch — run on live DB if not re-seeded |

### Migration apply order (full list)

| Order | File |
|------:|------|
| 1 | `001_schema.sql` |
| 2 | `002_game_day_cutoff.sql` |
| 3 | `003_api_sync.sql` |
| 4 | `005_auto_progression.sql` |
| 5 | `006_admin_predictions_audit.sql` |
| 6 | `007_user_paid.sql` |
| 7 | `008_restrict_predictions_rls.sql` |
| 8 | `009_admin_delete_user.sql` |
| 9 | `010_user_session_has_paid.sql` |
| 10 | `011_matchday_recap.sql` |
| 11 | `012_parallel_group_predictions.sql` |
| 12 | `012_prize_pot_stats.sql` |
| 13 | `013_fix_group_venue_typos.sql` |
| 14 | `014_repair_auth_functions.sql` |
| 15 | `015_enable_realtime.sql` |

*(No `004` migration — gap is normal.)*

---

## 4. Frontend UX/UI

**Score: 81 / 100**  
**Rating: Strong**

### Strengths
- Polished glass UI, Framer Motion, haptics
- Parallel group tabs with per-matchday countdowns
- Matchday recap modal
- Prize pot banner
- Live table/points (realtime + polling)
- Admin: payments, missing picks, audit, knockout editor, manual results + correction
- Animated leaderboard points

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| Low | `Dashboard.tsx` | Possible duplicate empty states |
| Low | Recap | Dashboard only, not Leaderboard |
| Low | `Landing.tsx` | Canvas animation CPU cost |

---

## 5. API sync & admin workflows

**Score: 72 / 100**  
**Rating: Good code; operational limitation on free API plan**

### Strengths
- Idle skip, 80/day cap, season-plan error detection + cron skip
- Clear JSON diagnostics on manual sync
- Full-season fetch + DB-first team matching
- `score.fulltime` fallback
- Progression cron for knockout placeholders
- Manual `submit_fixture_result` works without API
- Score correction recalculates all points

### Critical operational finding (production-confirmed)

```
API-Football error: Free plans do not have access to this season, try from 2022 to 2024.
```

| Implication | Detail |
|-------------|--------|
| Automatic sync | **Will not work** on free tier for `API_FOOTBALL_SEASON=2026` |
| Required workflow | **Admin → Technical → Manual Result Entry** after each game |
| Paid upgrade | [api-football.com/pricing](https://www.api-football.com/pricing) |

### Other findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | `vercel.json` | Cron `*/10` = up to 144 runs/day vs 80 API call cap |
| Medium | `api/lib/syncResults.ts` | No retry on transient API failures |
| Low | Team aliases | ~8 entries — name drift risk |

---

## 6. Testing & CI

**Score: 64 / 100**  
**Rating: Adequate for lib logic; thin elsewhere**

### Strengths
- GitHub Actions: lint → build → `test:ci` (`.github/workflows/ci.yml`)
- 5 test files: `scoring`, `matchdays`, `recapTier`, `recapStorage`, `prizePot` (~39 cases)

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | — | No component, E2E, RPC integration, or API route tests |
| Medium | Vitest on Windows | Occasional worker timeout flake |
| Low | — | Core RPCs untested in CI |

---

## 7. Deployment & operations

**Score: 80 / 100**  
**Rating: Good**

### Strengths
- Vercel SPA + API + crons (`vercel.json`)
- `@vercel/node`, 30s function timeout
- `.env.example` documents API plan limit
- Cron skip after API season errors

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | `README.md` | Migration table stops at `011` — missing `012`–`015` |
| Medium | — | No Sentry / error monitoring |
| Low | Vite build | Chunk size warning (cosmetic) |

---

## 8. Accessibility & performance

**Score: 53 / 100**  
**Rating: Needs work**

### Strengths
- `htmlFor` on auth fields; `aria-label` on inputs
- Group tabs tablist; `aria-live` on status banner
- `preconnect` in `index.html`; silent reloads

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| Medium | — | No skip-to-content link |
| Medium | `MatchdayRecapModal.tsx` | No focus trap |
| Medium | `LoginForm.tsx` | Passcode label not `aria-labelledby` |
| Low | `App.tsx` | No code splitting |

---

## 9. Documentation

**Score: 70 / 100**  
**Rating: Good but drifting**

### Strengths
- `README.md` setup, env, scoring, structure
- `.env.example` with API plan note
- This audit (v5)

### Findings

| Severity | Location | Issue |
|----------|----------|-------|
| High | `README.md` | Omits migrations `012`–`015` |
| Medium | `AUDITNEW.md` | Stale v4 doc |
| Low | `COPY.md` | May reference removed components |

---

## 10. Production readiness

**Score: 78 / 100**  
**Rating: Ready for closed-team tournament with manual scoring**

| Item | Status |
|------|--------|
| Sign-up / login | ✅ |
| Parallel group predictions | ✅ (migration `012_parallel`) |
| Per-game points + live table | ✅ (manual entry or paid API) |
| Prize pot | ✅ (migration `012_prize_pot`) |
| Realtime | ✅ (migration `015`) |
| Automatic API sync | ❌ on free API plan |
| Manual score entry + correction | ✅ |
| Knockout progression | ⚠️ auto path only |

---

## Weighted overall score

| Category | Weight | Score | Weighted |
|----------|-------:|------:|---------:|
| Security | 15% | 71 | 10.7 |
| Production readiness | 15% | 78 | 11.7 |
| Database | 10% | 85 | 8.5 |
| UX/UI | 12% | 81 | 9.7 |
| API & admin | 12% | 72 | 8.6 |
| Architecture | 10% | 77 | 7.7 |
| Testing | 10% | 64 | 6.4 |
| Deployment | 8% | 80 | 6.4 |
| Documentation | 4% | 70 | 2.8 |
| A11y & performance | 4% | 53 | 2.1 |
| **Total** | **100%** | | **75** |

---

## Prioritised action list

### P1 — Tournament operations (now)

1. **Enter scores manually** after each game — Admin → Technical → Manual Result Entry.
2. **Verify migrations 012–015** applied on production Supabase.
3. **Update README** migration table to include 012–015.

### P2 — When you have time

1. Reconcile cron `*/10` vs 80-request API cap (consider `*/20`).
2. Wire `complete_game_day` to progression queue (same as `auto_complete_matchday`).
3. Finish accessibility pass — skip link, recap focus trap, passcode `aria-labelledby`.
4. Fix `AuthProvider.tsx` ESLint warning.

### P3 — Nice to have

1. Route code splitting.
2. E2E smoke test (predict → score → leaderboard).
3. Error monitoring (Sentry).
4. Upgrade API-Football plan for automatic sync.

### Explicitly not required (operator decision)

- Login rate limiting / longer passcodes
- Server-side session invalidation
- Public-launch security hardening

---

## Operator quick reference (match day)

| Task | Where |
|------|--------|
| Enter / fix a score | Admin → Technical → Manual Result Entry → **Scored results** or matchday → **Update** |
| Check sync status | Admin → Technical → API Sync (expect error on free plan) |
| Live table | `/leaderboard` — ~30s poll + realtime |
| Wrong score | Same as enter — edit numbers → **Update** (points recalculate) |

---

## Summary

For a **closed BMFC team deployment**, the app scores **75/100** and is **ready to run the tournament** using **manual result entry**. Since v4, the biggest gains are parallel group predictions, live leaderboard updates, hardened API routes, and admin score correction.

The main operational lesson from live use: **API-Football’s free tier does not include World Cup 2026**. Automatic sync is implemented correctly but requires a paid plan; manual scoring is the supported workflow on the current tier.

Remaining weak spots — full accessibility, E2E coverage, bundle size, README drift — are proportionate to a private ~20-user app, not launch blockers for BMFC.

---

*End of audit v5. Reflects `main` at `01457e9` (11 June 2026).*
