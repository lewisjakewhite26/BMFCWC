-- Allow all three group-stage matchdays to be open for predictions in parallel.
-- Each matchday still locks 1 hour before its own earliest kickoff (see 002_game_day_cutoff).

CREATE OR REPLACE FUNCTION open_game_day(
  p_user_id uuid,
  p_session_token text,
  p_game_day integer
) RETURNS json AS $$
DECLARE
  admin_user users%ROWTYPE;
  prev_day game_days%ROWTYPE;
BEGIN
  SELECT * INTO admin_user FROM users WHERE id = p_user_id AND session_token = p_session_token;
  IF NOT FOUND OR NOT admin_user.is_admin THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Knockout matchdays (4+) stay sequential; group stage (1–3) can open independently.
  IF p_game_day > 3 THEN
    SELECT * INTO prev_day FROM game_days WHERE game_day = p_game_day - 1;
    IF prev_day.status != 'completed' THEN
      RAISE EXCEPTION 'Previous game day must be completed first';
    END IF;

    UPDATE game_days SET status = 'locked' WHERE status = 'open' AND game_day > 3;
  END IF;

  UPDATE game_days
  SET status = 'open', opened_at = COALESCE(opened_at, now())
  WHERE game_day = p_game_day;

  UPDATE fixtures
  SET status = 'open'
  WHERE game_day = p_game_day AND status IN ('upcoming', 'locked');

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auto_complete_matchday(p_game_day integer)
RETURNS void AS $$
DECLARE
  next_game_day integer;
  next_status text;
BEGIN
  UPDATE game_days
  SET status = 'completed', completed_at = now()
  WHERE game_day = p_game_day;

  INSERT INTO progression_log (game_day, event, details)
  VALUES (p_game_day, 'all_scored', jsonb_build_object('completed_at', now()));

  SELECT game_day INTO next_game_day
  FROM game_days
  WHERE game_day > p_game_day AND status = 'locked'
  ORDER BY game_day ASC
  LIMIT 1;

  IF next_game_day IS NOT NULL THEN
    SELECT status INTO next_status FROM game_days WHERE game_day = next_game_day;

    -- Skip queueing when the next matchday is already open (parallel group stage).
    IF next_status IS DISTINCT FROM 'open' THEN
      INSERT INTO progression_queue (game_day, scheduled_for)
      VALUES (next_game_day, now() + interval '1 hour')
      ON CONFLICT (game_day) DO UPDATE
      SET scheduled_for = EXCLUDED.scheduled_for,
          status = 'pending',
          processed_at = NULL;

      INSERT INTO progression_log (game_day, event, details)
      VALUES (next_game_day, 'wait_started', jsonb_build_object(
        'scheduled_for', now() + interval '1 hour'
      ));
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Open all group-stage matchdays for existing deployments.
UPDATE game_days
SET status = 'open', opened_at = COALESCE(opened_at, now())
WHERE game_day IN (1, 2, 3) AND status = 'locked';

UPDATE fixtures
SET status = 'open'
WHERE game_day IN (1, 2, 3) AND status = 'upcoming';
