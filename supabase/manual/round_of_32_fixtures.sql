-- Round of 32 (Matchday 4) real fixtures.
-- Run in Supabase Dashboard -> SQL Editor.
-- Kickoffs in BST are stored as UTC (BST minus 1 hour).
-- Updates by team pairing — safe to re-run. Does not touch points.

BEGIN;

UPDATE fixtures SET home_team = 'South Africa', away_team = 'Canada',     home_flag = '🇿🇦', away_flag = '🇨🇦', kickoff_utc = TIMESTAMPTZ '2026-06-28T19:00:00Z', venue = 'SoFi Stadium',          city = 'Los Angeles',  country = 'USA' WHERE game_day = 4 AND home_team = 'South Africa' AND away_team = 'Canada';
UPDATE fixtures SET home_team = 'Brazil',       away_team = 'Japan',      home_flag = '🇧🇷', away_flag = '🇯🇵', kickoff_utc = TIMESTAMPTZ '2026-06-29T17:00:00Z', venue = 'NRG Stadium',           city = 'Houston',      country = 'USA' WHERE game_day = 4 AND home_team = 'Brazil' AND away_team = 'Japan';
UPDATE fixtures SET home_team = 'Germany',      away_team = 'Paraguay',   home_flag = '🇩🇪', away_flag = '🇵🇾', kickoff_utc = TIMESTAMPTZ '2026-06-29T20:30:00Z', venue = 'Gillette Stadium',      city = 'Foxborough',   country = 'USA' WHERE game_day = 4 AND home_team = 'Germany' AND away_team = 'Paraguay';
UPDATE fixtures SET home_team = 'Netherlands',  away_team = 'Morocco',    home_flag = '🇳🇱', away_flag = '🇲🇦', kickoff_utc = TIMESTAMPTZ '2026-06-30T01:00:00Z', venue = 'Estadio BBVA',          city = 'Monterrey',    country = 'Mexico' WHERE game_day = 4 AND home_team = 'Netherlands' AND away_team = 'Morocco';
UPDATE fixtures SET home_team = 'Ivory Coast',  away_team = 'Norway',     home_flag = '🇨🇮', away_flag = '🇳🇴', kickoff_utc = TIMESTAMPTZ '2026-06-30T17:00:00Z', venue = 'AT&T Stadium',          city = 'Arlington',    country = 'USA' WHERE game_day = 4 AND home_team = 'Ivory Coast' AND away_team = 'Norway';
UPDATE fixtures SET home_team = 'France',       away_team = 'Sweden',     home_flag = '🇫🇷', away_flag = '🇸🇪', kickoff_utc = TIMESTAMPTZ '2026-06-30T21:00:00Z', venue = 'MetLife Stadium',       city = 'New Jersey',   country = 'USA' WHERE game_day = 4 AND home_team = 'France' AND away_team = 'Sweden';
UPDATE fixtures SET home_team = 'Mexico',       away_team = 'Ecuador',    home_flag = '🇲🇽', away_flag = '🇪🇨', kickoff_utc = TIMESTAMPTZ '2026-07-01T01:00:00Z', venue = 'Estadio Azteca',        city = 'Mexico City',  country = 'Mexico' WHERE game_day = 4 AND home_team = 'Mexico' AND away_team = 'Ecuador';
UPDATE fixtures SET home_team = 'England',      away_team = 'DR Congo',   home_flag = '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away_flag = '🇨🇩', kickoff_utc = TIMESTAMPTZ '2026-07-01T16:00:00Z', venue = 'Mercedes-Benz Stadium', city = 'Atlanta',      country = 'USA' WHERE game_day = 4 AND home_team = 'England' AND away_team = 'DR Congo';
UPDATE fixtures SET home_team = 'Belgium',      away_team = 'Senegal',    home_flag = '🇧🇪', away_flag = '🇸🇳', kickoff_utc = TIMESTAMPTZ '2026-07-01T20:00:00Z', venue = 'Lumen Field',           city = 'Seattle',      country = 'USA' WHERE game_day = 4 AND home_team = 'Belgium' AND away_team = 'Senegal';
UPDATE fixtures SET home_team = 'USA',          away_team = 'Bosnia',     home_flag = '🇺🇸', away_flag = '🇧🇦', kickoff_utc = TIMESTAMPTZ '2026-07-02T00:00:00Z', venue = 'Levi''s Stadium',       city = 'Santa Clara',  country = 'USA' WHERE game_day = 4 AND home_team = 'USA' AND away_team = 'Bosnia';
UPDATE fixtures SET home_team = 'Spain',        away_team = 'Austria',    home_flag = '🇪🇸', away_flag = '🇦🇹', kickoff_utc = TIMESTAMPTZ '2026-07-02T19:00:00Z', venue = 'SoFi Stadium',          city = 'Los Angeles',  country = 'USA' WHERE game_day = 4 AND home_team = 'Spain' AND away_team = 'Austria';
UPDATE fixtures SET home_team = 'Portugal',     away_team = 'Croatia',    home_flag = '🇵🇹', away_flag = '🇭🇷', kickoff_utc = TIMESTAMPTZ '2026-07-02T23:00:00Z', venue = 'BMO Field',             city = 'Toronto',      country = 'Canada' WHERE game_day = 4 AND home_team = 'Portugal' AND away_team = 'Croatia';
UPDATE fixtures SET home_team = 'Switzerland',  away_team = 'Algeria',    home_flag = '🇨🇭', away_flag = '🇩🇿', kickoff_utc = TIMESTAMPTZ '2026-07-03T03:00:00Z', venue = 'BC Place',              city = 'Vancouver',    country = 'Canada' WHERE game_day = 4 AND home_team = 'Switzerland' AND away_team = 'Algeria';
UPDATE fixtures SET home_team = 'Australia',    away_team = 'Egypt',      home_flag = '🇦🇺', away_flag = '🇪🇬', kickoff_utc = TIMESTAMPTZ '2026-07-03T18:00:00Z', venue = 'AT&T Stadium',          city = 'Arlington',    country = 'USA' WHERE game_day = 4 AND home_team = 'Australia' AND away_team = 'Egypt';
UPDATE fixtures SET home_team = 'Argentina',    away_team = 'Cape Verde', home_flag = '🇦🇷', away_flag = '🇨🇻', kickoff_utc = TIMESTAMPTZ '2026-07-03T22:00:00Z', venue = 'Hard Rock Stadium',     city = 'Miami',        country = 'USA' WHERE game_day = 4 AND home_team = 'Argentina' AND away_team = 'Cape Verde';
UPDATE fixtures SET home_team = 'Colombia',     away_team = 'Ghana',      home_flag = '🇨🇴', away_flag = '🇬🇭', kickoff_utc = TIMESTAMPTZ '2026-07-04T01:30:00Z', venue = 'Arrowhead Stadium',     city = 'Kansas City',  country = 'USA' WHERE game_day = 4 AND home_team = 'Colombia' AND away_team = 'Ghana';

-- First-time load from placeholders: map by kickoff order (run only if teams not set yet).
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
    (9,  'Belgium',      'Senegal',    '🇧🇪', '🇸🇳', TIMESTAMPTZ '2026-07-01T20:00:00Z', 'Lumen Field',           'Seattle',      'USA'),
    (10, 'USA',          'Bosnia',     '🇺🇸', '🇧🇦', TIMESTAMPTZ '2026-07-02T00:00:00Z', 'Levi''s Stadium',       'Santa Clara',  'USA'),
    (11, 'Spain',        'Austria',    '🇪🇸', '🇦🇹', TIMESTAMPTZ '2026-07-02T19:00:00Z', 'SoFi Stadium',          'Los Angeles',  'USA'),
    (12, 'Portugal',     'Croatia',    '🇵🇹', '🇭🇷', TIMESTAMPTZ '2026-07-02T23:00:00Z', 'BMO Field',             'Toronto',      'Canada'),
    (13, 'Switzerland',  'Algeria',    '🇨🇭', '🇩🇿', TIMESTAMPTZ '2026-07-03T03:00:00Z', 'BC Place',              'Vancouver',    'Canada'),
    (14, 'Australia',    'Egypt',      '🇦🇺', '🇪🇬', TIMESTAMPTZ '2026-07-03T18:00:00Z', 'AT&T Stadium',          'Arlington',    'USA'),
    (15, 'Argentina',    'Cape Verde', '🇦🇷', '🇨🇻', TIMESTAMPTZ '2026-07-03T22:00:00Z', 'Hard Rock Stadium',     'Miami',        'USA'),
    (16, 'Colombia',     'Ghana',      '🇨🇴', '🇬🇭', TIMESTAMPTZ '2026-07-04T01:30:00Z', 'Arrowhead Stadium',     'Kansas City',  'USA')
),
existing AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY kickoff_utc, id) AS rn
  FROM fixtures
  WHERE game_day = 4
    AND (home_team LIKE 'Group%' OR home_team LIKE '3rd Place%' OR away_team LIKE 'Group%' OR away_team LIKE '3rd Place%')
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

SELECT home_team, away_team, kickoff_utc, city
FROM fixtures
WHERE game_day = 4
ORDER BY kickoff_utc;

COMMIT;

-- Open Matchday 4 (run when ready):
-- UPDATE game_days SET status = 'locked' WHERE status = 'open' AND game_day > 3;
-- UPDATE game_days SET status = 'open', opened_at = COALESCE(opened_at, now()) WHERE game_day = 4;
-- UPDATE fixtures  SET status = 'open' WHERE game_day = 4 AND status IN ('upcoming', 'locked');
