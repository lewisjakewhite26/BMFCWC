-- Enable Supabase Realtime for live leaderboard and match updates.
-- Safe to re-run: skips tables already in the publication.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE users;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE fixtures;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE predictions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
