-- Correct two group-stage venue typos (MD2).

UPDATE fixtures
SET venue = 'MetLife Stadium', city = 'New Jersey', country = 'USA'
WHERE game_day = 2
  AND stage = 'group'
  AND group_name = 'I'
  AND home_team = 'Norway'
  AND away_team = 'Senegal';

UPDATE fixtures
SET venue = 'BMO Field', city = 'Toronto', country = 'Canada'
WHERE game_day = 2
  AND stage = 'group'
  AND group_name = 'L'
  AND home_team = 'Panama'
  AND away_team = 'Croatia';
