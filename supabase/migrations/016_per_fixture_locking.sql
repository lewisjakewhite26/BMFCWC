-- Per-fixture prediction locking: each fixture locks 1 hour before its own kickoff

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

  IF fix.status IN ('completed', 'locked') THEN
    RAISE EXCEPTION 'Fixture is locked';
  END IF;

  INSERT INTO predictions (user_id, fixture_id, predicted_home, predicted_away)
  VALUES (p_user_id, p_fixture_id, p_predicted_home, p_predicted_away)
  ON CONFLICT (user_id, fixture_id)
  DO UPDATE SET predicted_home = p_predicted_home, predicted_away = p_predicted_away;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION lock_expired_fixtures()
RETURNS void AS $$
BEGIN
  UPDATE fixtures f
  SET status = 'locked'
  FROM game_days gd
  WHERE f.game_day = gd.game_day
    AND gd.status = 'open'
    AND f.status IN ('upcoming', 'open')
    AND f.home_score IS NULL
    AND now() >= f.kickoff_utc - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION submit_prediction TO anon, authenticated;
