-- Allow admins to set knockout fixture flags alongside team names.
-- Flag params are optional; when NULL the existing flag is preserved.

CREATE OR REPLACE FUNCTION admin_update_fixture_teams(
  p_user_id uuid,
  p_session_token text,
  p_fixture_id integer,
  p_home_team text,
  p_away_team text,
  p_home_flag text DEFAULT NULL,
  p_away_flag text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  admin_user users%ROWTYPE;
BEGIN
  SELECT * INTO admin_user FROM users WHERE id = p_user_id AND session_token = p_session_token;
  IF NOT FOUND OR NOT admin_user.is_admin THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF length(trim(p_home_team)) = 0 OR length(trim(p_away_team)) = 0 THEN
    RAISE EXCEPTION 'Team names cannot be empty';
  END IF;

  UPDATE fixtures
  SET home_team = trim(p_home_team),
      away_team = trim(p_away_team),
      home_flag = COALESCE(NULLIF(trim(p_home_flag), ''), home_flag),
      away_flag = COALESCE(NULLIF(trim(p_away_flag), ''), away_flag)
  WHERE id = p_fixture_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fixture not found';
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_update_fixture_teams TO anon, authenticated;
