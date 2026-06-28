-- Round of 32 (Matchday 4) real fixtures.
-- Run once in Supabase Dashboard -> SQL Editor.
-- Kickoffs supplied in BST (UTC+1) and stored here in UTC (1 hour earlier).
-- Does NOT touch users.total_points or predictions — everyone keeps their points.
--
-- Mapping: the 16 existing Matchday 4 fixtures are matched to the new ones by
-- chronological order (their current kickoff order -> new kickoff order), so no
-- fixture IDs are needed and the update is deterministic.

BEGIN;

WITH new_fixtures (rn, home_team, away_team, home_flag, away_flag, kickoff_utc, venue, city, country) AS (
  VALUES
    (1,  'South Africa', 'Canada',     '🇿🇦', '🇨🇦', TIMESTAMPTZ '2026-06-28T19:00:00Z', 'SoFi Stadium',          'Los Angeles',  'USA'),
    (2,  'Brazil',       'Japan',      '🇧🇷', '🇯🇵', TIMESTAMPTZ '2026-06-29T17:00:00Z', 'NRG Stadium',           'Houston',      'USA'),
    (3,  'Germany',      'Paraguay',   '🇩🇪', '🇵🇾', TIMESTAMPTZ '2026-06-29T20:30:00Z', 'Gillette Stadium',      'Foxborough',   'USA'),
    (4,  'Netherlands',  'Morocco',    '🇳🇱', '🇲🇦', TIMESTAMPTZ '2026-06-30T01:00:00Z', 'Estadio BBVA',          'Monterrey',    'Mexico'),
    (5,  'Ivory Coast',  'Norway',     '🇨🇮', '🇳🇴', TIMESTAMPTZ '2026-06-30T17:00:00Z', 'AT&T Stadium',          'Arlington',    'USA'),
    (6,  'France',       'Sweden',     '🇫🇷', '🇸🇪', TIMESTAMPTZ '2026-06-30T21:00:00Z', 'MetLife Stadium',       'New Jersey',   'USA'),
    (7,  'Mexico',       'Ecuador',    '🇲🇽', '🇪🇨', TIMESTAMPTZ '2026-07-01T01:00:00Z', 'Estadio Azteca',        'Mexico City',  'Mexico'),
    (8,  'England',      'DR Congo',   '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇨🇩', TIMESTAMPTZ '2026-07-01T16:00:00Z', 'Mercedes-Benz Stadium', 'Atlanta',      'USA'),
    (9,  'USA',          'Bosnia',     '🇺🇸', '🇧🇦', TIMESTAMPTZ '2026-07-02T00:00:00Z', 'Levi''s Stadium',       'Santa Clara',  'USA'),
    (10, 'Spain',        'Austria',    '🇪🇸', '🇦🇹', TIMESTAMPTZ '2026-07-02T19:00:00Z', 'SoFi Stadium',          'Los Angeles',  'USA'),
    (11, 'Portugal',     'Croatia',    '🇵🇹', '🇭🇷', TIMESTAMPTZ '2026-07-02T23:00:00Z', 'BMO Field',             'Toronto',      'Canada'),
    (12, 'Switzerland',  'Algeria',    '🇨🇭', '🇩🇿', TIMESTAMPTZ '2026-07-03T03:00:00Z', 'BC Place',              'Vancouver',    'Canada'),
    (13, 'Australia',    'Egypt',      '🇦🇺', '🇪🇬', TIMESTAMPTZ '2026-07-03T18:00:00Z', 'AT&T Stadium',          'Arlington',    'USA'),
    (14, 'Argentina',    'Cape Verde', '🇦🇷', '🇨🇻', TIMESTAMPTZ '2026-07-03T22:00:00Z', 'Hard Rock Stadium',     'Miami',        'USA'),
    (15, 'Colombia',     'Ghana',      '🇨🇴', '🇬🇭', TIMESTAMPTZ '2026-07-04T01:30:00Z', 'Arrowhead Stadium',     'Kansas City',  'USA'),
    (16, 'Belgium',      'Senegal',    '🇧🇪', '🇸🇳', TIMESTAMPTZ '2026-07-04T20:00:00Z', 'Lumen Field',           'Seattle',      'USA')
),
existing AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY kickoff_utc, id) AS rn
  FROM fixtures
  WHERE game_day = 4
)
UPDATE fixtures f
SET home_team   = n.home_team,
    away_team   = n.away_team,
    home_flag   = n.home_flag,
    away_flag   = n.away_flag,
    kickoff_utc = n.kickoff_utc,
    venue       = n.venue,
    city        = n.city,
    country     = n.country
FROM existing e
JOIN new_fixtures n ON n.rn = e.rn
WHERE f.id = e.id;

-- Verify before committing: should return 16 rows with the real teams.
SELECT id, home_team, away_team, home_flag, away_flag, kickoff_utc, venue, city, country
FROM fixtures
WHERE game_day = 4
ORDER BY kickoff_utc;

COMMIT;

-- ============================================================================
-- STEP 2 — Open Matchday 4 for predictions (run only when you're ready to go live).
-- Make sure Matchdays 1–3 are marked completed first (admin panel or below).
-- Points are untouched by this.
-- ============================================================================
-- UPDATE game_days SET status = 'locked' WHERE status = 'open' AND game_day > 3;
-- UPDATE game_days SET status = 'open', opened_at = COALESCE(opened_at, now()) WHERE game_day = 4;
-- UPDATE fixtures  SET status = 'open' WHERE game_day = 4 AND status IN ('upcoming', 'locked');
