-- supabase/migrations/20261026_delete_user_account_rpc.sql
-- Function to allow authenticated users to atomically delete their own account from auth.users,
-- which cascades down to public.profiles, entries, user_challenges, and household memberships.

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Deleting from auth.users cascades to public.profiles, entries, user_stats, etc.
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;
