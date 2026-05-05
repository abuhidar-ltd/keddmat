-- Recreate (or create) the handle_new_user trigger so it never sets is_active = true.
-- The trigger inserts a minimal stub row; the client-side signUp call then upserts
-- the full profile (store_name, slug, phone, etc.) on top of it.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, is_active)
  VALUES (NEW.id, false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the column default is false (belt-and-suspenders in case it was changed)
ALTER TABLE public.profiles ALTER COLUMN is_active SET DEFAULT false;
