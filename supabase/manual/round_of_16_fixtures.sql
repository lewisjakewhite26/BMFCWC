-- Round of 16 (Matchday 5) — 8 fixtures.
-- Run in Supabase Dashboard -> SQL Editor.
-- Kickoffs in BST stored as UTC (BST minus 1 hour). Does not touch points.
-- Match 87 winner: Colombia (beat Ghana in R32).

BEGIN;

WITH new_fixtures (rn, home_team, away_team, home_flag, away_flag, kickoff_utc, venue, city, country) AS (
  VALUES
    (1, 'Canada',     'Morocco',    '🇨🇦', '🇲🇦', TIMESTAMPTZ '2026-07-04T12:00:00Z', 'NRG Stadium',               'Houston',      'USA'),
    (2, 'Paraguay',   'France',     '🇵🇾', '🇫🇷', TIMESTAMPTZ '2026-07-04T16:00:00Z', 'Lincoln Financial Field', 'Philadelphia', 'USA'),
    (3, 'Brazil',     'Norway',     '🇧🇷', '🇳🇴', TIMESTAMPTZ '2026-07-05T15:00:00Z', 'MetLife Stadium',           'New Jersey',   'USA'),
    (4, 'Mexico',     'England',    '🇲🇽', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', TIMESTAMPTZ '2026-07-05T19:00:00Z', 'Estadio Azteca',            'Mexico City',  'Mexico'),
    (5, 'Portugal',   'Spain',      '🇵🇹', '🇪🇸', TIMESTAMPTZ '2026-07-06T14:00:00Z', 'AT&T Stadium',              'Arlington',    'USA'),
    (6, 'USA',        'Belgium',    '🇺🇸', '🇧🇪', TIMESTAMPTZ '2026-07-06T19:00:00Z', 'Lumen Field',               'Seattle',      'USA'),
    (7, 'Argentina',  'Egypt',      '🇦🇷', '🇪🇬', TIMESTAMPTZ '2026-07-07T11:00:00Z', 'Mercedes-Benz Stadium',     'Atlanta',      'USA'),
    (8, 'Switzerland','Colombia',   '🇨🇭', '🇨🇴', TIMESTAMPTZ '2026-07-07T15:00:00Z', 'BC Place',                  'Vancouver',    'Canada')
),
existing AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY kickoff_utc, id) AS rn
  FROM fixtures
  WHERE game_day = 5
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

-- Verify: 8 rows, ordered by kickoff (BST = UTC + 1 hour)
SELECT home_team, away_team, kickoff_utc, city
FROM fixtures
WHERE game_day = 5
ORDER BY kickoff_utc;

COMMIT;

-- ============================================================================
-- STEP 2 — Open Matchday 5 for predictions (run when ready).
-- Matchday 4 must be completed first. Points untouched.
-- ============================================================================
-- UPDATE game_days SET status = 'locked' WHERE status = 'open' AND game_day > 3 AND game_day <> 5;
-- UPDATE game_days SET status = 'open', opened_at = COALESCE(opened_at, now()) WHERE game_day = 5;
-- UPDATE fixtures  SET status = 'open' WHERE game_day = 5 AND status IN ('upcoming', 'locked');
