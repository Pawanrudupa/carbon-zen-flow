-- supabase/migrations/20261026_entry_streak_and_xp_trigger.sql
-- Automatically awards XP and updates daily streaks when a user logs an entry.

CREATE OR REPLACE FUNCTION public.handle_entry_stats_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INT := 0;
  v_longest_streak INT := 0;
  v_today DATE := (NEW.logged_at AT TIME ZONE 'UTC')::DATE;
BEGIN
  -- 1. Ensure user_stats row exists
  INSERT INTO public.user_stats (user_id, total_xp, current_level, current_streak, longest_streak, last_entry_date)
  VALUES (NEW.user_id, 10, 1, 1, 1, v_today)
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Fetch current stats
  SELECT last_entry_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM public.user_stats
  WHERE user_id = NEW.user_id;

  -- 3. Calculate consecutive calendar day streak
  IF v_last_date IS NULL OR v_last_date < (v_today - INTERVAL '1 day') THEN
    -- Streak broken (or first entry)
    v_current_streak := 1;
  ELSIF v_last_date = (v_today - INTERVAL '1 day') THEN
    -- Consecutive day: increment streak
    v_current_streak := v_current_streak + 1;
  ELSE
    -- Already logged today (v_last_date = v_today): streak remains the same
    NULL;
  END IF;

  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- 4. Award 10 XP for every logged entry + update streak & level
  UPDATE public.user_stats
  SET total_xp = total_xp + 10,
      current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_entry_date = v_today,
      current_level = ((total_xp + 10) / 1000) + 1,
      updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_entry_logged_stats ON public.entries;
CREATE TRIGGER on_entry_logged_stats
  AFTER INSERT ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_entry_stats_update();
