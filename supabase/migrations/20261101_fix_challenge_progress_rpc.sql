-- Migration: Fix challenge progress RPC to support days criteria and prevent instant completion
-- File: supabase/migrations/20261101_fix_challenge_progress_rpc.sql

CREATE OR REPLACE FUNCTION calculate_challenge_progress(
  p_user_id uuid,
  p_challenge_id uuid
) RETURNS decimal AS $$
DECLARE
  v_challenge record;
  v_user_challenge record;
  v_progress decimal := 0;
  v_criteria jsonb;
  v_days_elapsed int;
  v_required_days int;
  v_entry_count int;
  v_target_count int;
BEGIN
  SELECT * INTO v_challenge FROM challenges WHERE id = p_challenge_id;
  SELECT * INTO v_user_challenge FROM user_challenges
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  v_criteria := v_challenge.tracking_criteria;
  v_days_elapsed := GREATEST(0, EXTRACT(DAY FROM now() - v_user_challenge.started_at)::int);
  v_required_days := GREATEST(1, v_challenge.duration_days);

  CASE v_criteria->>'type'
    WHEN 'entry_count' THEN
      SELECT COUNT(*) INTO v_entry_count
      FROM entries
      WHERE user_id = p_user_id
        AND logged_at >= v_user_challenge.started_at
        AND (v_criteria->>'category' IS NULL OR category = v_criteria->>'category');

      -- Coalesce min_count with days and duration_days so challenges like Plant-Powered Week don't divide by 1
      v_target_count := COALESCE(
        (v_criteria->>'min_count')::int,
        (v_criteria->>'days')::int,
        v_challenge.duration_days,
        7
      );

      v_progress := LEAST(100, v_entry_count * 100.0 / GREATEST(1, v_target_count));

    WHEN 'no_entries' THEN
      v_progress := LEAST(100, v_days_elapsed * 100.0 / v_required_days);

    WHEN 'co2_reduction' THEN
      v_progress := LEAST(100, v_days_elapsed * 100.0 / v_required_days);

    WHEN 'streak' THEN
      v_progress := LEAST(100, v_days_elapsed * 100.0 / v_required_days);

    ELSE
      v_progress := LEAST(100, v_days_elapsed * 100.0 / v_required_days);
  END CASE;

  RETURN LEAST(100, GREATEST(0, v_progress));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
