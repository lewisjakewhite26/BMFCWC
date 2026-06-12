-- Repair fixtures prematurely locked by old matchday-wide lock_expired_fixtures logic

UPDATE fixtures
SET status = 'open'
WHERE status = 'locked'
  AND home_score IS NULL
  AND now() < kickoff_utc - interval '1 hour';

CREATE OR REPLACE FUNCTION submit_prediction(
  p_user_id uuid,
  p_session_token text,
  p_fixture_id integer,
  p_predicted_home integer,
  p_predicted_away integer
) RETURNS json AS $$
DECLARE
  fix fixtures%ROWTYPE;
  gd game_days%ROWTYPE;
BEGIN
  IF NOT verify_session(p_user_id, p_session_token) THEN
    RAISE EXCEPTION 'Invalid session';
  END IF;

  SELECT * INTO fix FROM fixtures WHERE id = p_fixture_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fixture not found';
  END IF;

  SELECT * INTO gd FROM game_days WHERE game_day = fix.game_day;
  IF gd.status != 'open' THEN
    RAISE EXCEPTION 'Game day is not open';
  END IF;

  IF now() >= fix.kickoff_utc - interval '1 hour' THEN
    RAISE EXCEPTION 'Predictions are locked for this fixture';
  END IF;

  IF fix.status = 'completed' OR (fix.home_score IS NOT NULL AND fix.away_score IS NOT NULL) THEN
    RAISE EXCEPTION 'Fixture is locked';
  END IF;

  INSERT INTO predictions (user_id, fixture_id, predicted_home, predicted_away)
  VALUES (p_user_id, p_fixture_id, p_predicted_home, p_predicted_away)
  ON CONFLICT (user_id, fixture_id)
  DO UPDATE SET predicted_home = p_predicted_home, predicted_away = p_predicted_away;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION submit_prediction TO anon, authenticated;
