-- Round of 16 (Matchday 5) — full setup.
-- Kickoffs from BBC Sport schedule (UK/BST): https://www.bbc.co.uk/sport/football/world-cup/schedule
-- Stored as UTC (BST minus 1 hour). Does not touch points or predictions.

BEGIN;

-- 1. Set all 8 Round of 16 fixtures (replaces R32 Winner placeholders)
WITH new_fixtures (rn, home_team, away_team, home_flag, away_flag, kickoff_utc, venue, city, country) AS (
  VALUES
    (1, 'Canada',      'Morocco',   '🇨🇦', '🇲🇦', TIMESTAMPTZ '2026-07-04T17:00:00Z', 'NRG Stadium',               'Houston',      'USA'),    -- Sat 4 Jul 18:00 BST
    (2, 'Paraguay',    'France',    '🇵🇾', '🇫🇷', TIMESTAMPTZ '2026-07-04T21:00:00Z', 'Lincoln Financial Field', 'Philadelphia', 'USA'),    -- Sat 4 Jul 22:00 BST
    (3, 'Brazil',      'Norway',    '🇧🇷', '🇳🇴', TIMESTAMPTZ '2026-07-05T20:00:00Z', 'MetLife Stadium',           'New Jersey',   'USA'),    -- Sun 5 Jul 21:00 BST
    (4, 'Mexico',      'England',   '🇲🇽', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', TIMESTAMPTZ '2026-07-06T00:00:00Z', 'Estadio Azteca',            'Mexico City',  'Mexico'), -- Mon 6 Jul 01:00 BST
    (5, 'Portugal',    'Spain',     '🇵🇹', '🇪🇸', TIMESTAMPTZ '2026-07-06T19:00:00Z', 'AT&T Stadium',              'Arlington',    'USA'),    -- Mon 6 Jul 20:00 BST
    (6, 'USA',         'Belgium',   '🇺🇸', '🇧🇪', TIMESTAMPTZ '2026-07-07T00:00:00Z', 'Lumen Field',               'Seattle',      'USA'),    -- Tue 7 Jul 01:00 BST
    (7, 'Argentina',   'Egypt',     '🇦🇷', '🇪🇬', TIMESTAMPTZ '2026-07-07T16:00:00Z', 'Mercedes-Benz Stadium',     'Atlanta',      'USA'),    -- Tue 7 Jul 17:00 BST
    (8, 'Switzerland', 'Colombia',  '🇨🇭', '🇨🇴', TIMESTAMPTZ '2026-07-07T20:00:00Z', 'BC Place',                  'Vancouver',    'Canada')  -- Tue 7 Jul 21:00 BST
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

-- 2. Open Matchday 5 for predictions (Matchday 4 must already be completed)
UPDATE game_days SET status = 'locked' WHERE status = 'open' AND game_day > 3 AND game_day <> 5;
UPDATE game_days SET status = 'open', opened_at = COALESCE(opened_at, now()) WHERE game_day = 5;
UPDATE fixtures  SET status = 'open' WHERE game_day = 5 AND status IN ('upcoming', 'locked');

-- 3. Verify
SELECT home_team, away_team, kickoff_utc, city, status
FROM fixtures
WHERE game_day = 5
ORDER BY kickoff_utc;

SELECT game_day, status FROM game_days WHERE game_day IN (4, 5);

COMMIT;
