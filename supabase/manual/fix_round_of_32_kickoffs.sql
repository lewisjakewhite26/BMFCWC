-- Fix Round of 32 kickoffs (Matchday 4) by team pairing.
-- Safe to re-run: updates rows where home/away match, does not touch points.
--
-- Belgium vs Senegal was stored as 4 Jul 21:00 BST; the real fixture is
-- 1 Jul 21:00 BST (1:00 pm Seattle / 20:00 UTC).

BEGIN;

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-06-28T19:00:00Z',
  venue = 'SoFi Stadium', city = 'Los Angeles', country = 'USA'
WHERE game_day = 4 AND home_team = 'South Africa' AND away_team = 'Canada';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-06-29T17:00:00Z',
  venue = 'NRG Stadium', city = 'Houston', country = 'USA'
WHERE game_day = 4 AND home_team = 'Brazil' AND away_team = 'Japan';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-06-29T20:30:00Z',
  venue = 'Gillette Stadium', city = 'Foxborough', country = 'USA'
WHERE game_day = 4 AND home_team = 'Germany' AND away_team = 'Paraguay';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-06-30T01:00:00Z',
  venue = 'Estadio BBVA', city = 'Monterrey', country = 'Mexico'
WHERE game_day = 4 AND home_team = 'Netherlands' AND away_team = 'Morocco';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-06-30T17:00:00Z',
  venue = 'AT&T Stadium', city = 'Arlington', country = 'USA'
WHERE game_day = 4 AND home_team = 'Ivory Coast' AND away_team = 'Norway';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-06-30T21:00:00Z',
  venue = 'MetLife Stadium', city = 'New Jersey', country = 'USA'
WHERE game_day = 4 AND home_team = 'France' AND away_team = 'Sweden';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-07-01T01:00:00Z',
  venue = 'Estadio Azteca', city = 'Mexico City', country = 'Mexico'
WHERE game_day = 4 AND home_team = 'Mexico' AND away_team = 'Ecuador';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-07-01T16:00:00Z',
  venue = 'Mercedes-Benz Stadium', city = 'Atlanta', country = 'USA'
WHERE game_day = 4 AND home_team = 'England' AND away_team = 'DR Congo';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-07-01T20:00:00Z',
  venue = 'Lumen Field', city = 'Seattle', country = 'USA'
WHERE game_day = 4 AND home_team = 'Belgium' AND away_team = 'Senegal';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-07-02T00:00:00Z',
  venue = 'Levi''s Stadium', city = 'Santa Clara', country = 'USA'
WHERE game_day = 4 AND home_team = 'USA' AND away_team = 'Bosnia';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-07-02T19:00:00Z',
  venue = 'SoFi Stadium', city = 'Los Angeles', country = 'USA'
WHERE game_day = 4 AND home_team = 'Spain' AND away_team = 'Austria';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-07-02T23:00:00Z',
  venue = 'BMO Field', city = 'Toronto', country = 'Canada'
WHERE game_day = 4 AND home_team = 'Portugal' AND away_team = 'Croatia';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-07-03T03:00:00Z',
  venue = 'BC Place', city = 'Vancouver', country = 'Canada'
WHERE game_day = 4 AND home_team = 'Switzerland' AND away_team = 'Algeria';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-07-03T18:00:00Z',
  venue = 'AT&T Stadium', city = 'Arlington', country = 'USA'
WHERE game_day = 4 AND home_team = 'Australia' AND away_team = 'Egypt';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-07-03T22:00:00Z',
  venue = 'Hard Rock Stadium', city = 'Miami', country = 'USA'
WHERE game_day = 4 AND home_team = 'Argentina' AND away_team = 'Cape Verde';

UPDATE fixtures SET
  kickoff_utc = TIMESTAMPTZ '2026-07-04T01:30:00Z',
  venue = 'Arrowhead Stadium', city = 'Kansas City', country = 'USA'
WHERE game_day = 4 AND home_team = 'Colombia' AND away_team = 'Ghana';

-- Verify: 16 rows, Belgium should show 2026-07-01 20:00:00+00 (= Wed 1 Jul 21:00 BST)
SELECT home_team, away_team, kickoff_utc, city
FROM fixtures
WHERE game_day = 4
ORDER BY kickoff_utc;

COMMIT;
