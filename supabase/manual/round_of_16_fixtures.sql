-- Round of 16 (Matchday 5) — 8 fixtures.
-- Kickoffs cross-referenced with BBC Sport schedule (UK/BST display).
-- https://www.bbc.co.uk/sport/football/world-cup/schedule
-- Stored as UTC (BST minus 1 hour). Does not touch points.

BEGIN;

WITH new_fixtures (rn, home_team, away_team, home_flag, away_flag, kickoff_utc, venue, city, country) AS (
  VALUES
    (1, 'Canada',     'Morocco',    '🇨🇦', '🇲🇦', TIMESTAMPTZ '2026-07-04T17:00:00Z', 'NRG Stadium',               'Houston',      'USA'),   -- Sat 4 Jul 18:00 BST
    (2, 'Paraguay',   'France',     '🇵🇾', '🇫🇷', TIMESTAMPTZ '2026-07-04T21:00:00Z', 'Lincoln Financial Field', 'Philadelphia', 'USA'),   -- Sat 4 Jul 22:00 BST
    (3, 'Brazil',     'Norway',     '🇧🇷', '🇳🇴', TIMESTAMPTZ '2026-07-05T20:00:00Z', 'MetLife Stadium',           'New Jersey',   'USA'),   -- Sun 5 Jul 21:00 BST
    (4, 'Mexico',     'England',    '🇲🇽', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', TIMESTAMPTZ '2026-07-06T00:00:00Z', 'Estadio Azteca',            'Mexico City',  'Mexico'), -- Mon 6 Jul 01:00 BST
    (5, 'Portugal',   'Spain',      '🇵🇹', '🇪🇸', TIMESTAMPTZ '2026-07-06T19:00:00Z', 'AT&T Stadium',              'Arlington',    'USA'),   -- Mon 6 Jul 20:00 BST
    (6, 'USA',        'Belgium',    '🇺🇸', '🇧🇪', TIMESTAMPTZ '2026-07-07T00:00:00Z', 'Lumen Field',               'Seattle',      'USA'),   -- Tue 7 Jul 01:00 BST
    (7, 'Argentina',  'Egypt',      '🇦🇷', '🇪🇬', TIMESTAMPTZ '2026-07-07T16:00:00Z', 'Mercedes-Benz Stadium',     'Atlanta',      'USA'),   -- Tue 7 Jul 17:00 BST
    (8, 'Switzerland','Colombia',   '🇨🇭', '🇨🇴', TIMESTAMPTZ '2026-07-07T20:00:00Z', 'BC Place',                  'Vancouver',    'Canada') -- Tue 7 Jul 21:00 BST
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

-- Re-run safe fix by team pairing (if already loaded with wrong times):
UPDATE fixtures SET kickoff_utc = TIMESTAMPTZ '2026-07-04T17:00:00Z' WHERE game_day = 5 AND home_team = 'Canada'     AND away_team = 'Morocco';
UPDATE fixtures SET kickoff_utc = TIMESTAMPTZ '2026-07-04T21:00:00Z' WHERE game_day = 5 AND home_team = 'Paraguay'   AND away_team = 'France';
UPDATE fixtures SET kickoff_utc = TIMESTAMPTZ '2026-07-05T20:00:00Z' WHERE game_day = 5 AND home_team = 'Brazil'     AND away_team = 'Norway';
UPDATE fixtures SET kickoff_utc = TIMESTAMPTZ '2026-07-06T00:00:00Z' WHERE game_day = 5 AND home_team = 'Mexico'     AND away_team = 'England';
UPDATE fixtures SET kickoff_utc = TIMESTAMPTZ '2026-07-06T19:00:00Z' WHERE game_day = 5 AND home_team = 'Portugal'   AND away_team = 'Spain';
UPDATE fixtures SET kickoff_utc = TIMESTAMPTZ '2026-07-07T00:00:00Z' WHERE game_day = 5 AND home_team = 'USA'        AND away_team = 'Belgium';
UPDATE fixtures SET kickoff_utc = TIMESTAMPTZ '2026-07-07T16:00:00Z' WHERE game_day = 5 AND home_team = 'Argentina'  AND away_team = 'Egypt';
UPDATE fixtures SET kickoff_utc = TIMESTAMPTZ '2026-07-07T20:00:00Z' WHERE game_day = 5 AND home_team = 'Switzerland' AND away_team = 'Colombia';

SELECT home_team, away_team, kickoff_utc, city
FROM fixtures
WHERE game_day = 5
ORDER BY kickoff_utc;

COMMIT;
