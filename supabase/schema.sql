-- ============================================================
-- Keddmat — Complete Schema
-- Run this entire file on a fresh Supabase project (SQL editor).
-- ============================================================

-- ============================================================
-- 1. profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name          text,
  store_description   text,
  avatar_url          text,
  cover_url           text,
  page_slug           text        UNIQUE,
  whatsapp_number     text,
  phone               text,
  is_active           boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated owners manage their own row
CREATE POLICY "Owners manage own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can read active stores
CREATE POLICY "Public read active profiles"
  ON public.profiles FOR SELECT
  USING (is_active = true);

-- Service role has unrestricted access (needed by admin edge functions)
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 2. products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id                  uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               text          NOT NULL,
  description         text,
  price               numeric(10,3) NOT NULL DEFAULT 0,
  image_url           text,
  delivery_available  boolean       NOT NULL DEFAULT false,
  delivery_price      numeric(10,3),
  created_at          timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own products"
  ON public.products FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read products"
  ON public.products FOR SELECT
  USING (true);

-- ============================================================
-- 3. store_analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_analytics (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  text        NOT NULL CHECK (event_type IN ('link_click', 'whatsapp_click', 'product_view')),
  product_id  uuid        REFERENCES public.products(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics"
  ON public.store_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners read own analytics"
  ON public.store_analytics FOR SELECT
  USING (auth.uid() = store_id);

CREATE POLICY "Service role full access on analytics"
  ON public.store_analytics FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- 4. reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id        uuid        NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reviewer_name   text        NOT NULL,
  rating          integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read reviews"
  ON public.reviews FOR SELECT
  USING (true);

-- ============================================================
-- 5. public_profiles view
-- Exposed to anon so the public store page can read store data.
-- ============================================================
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  user_id,
  store_name,
  store_description,
  avatar_url,
  cover_url,
  page_slug,
  whatsapp_number,
  is_active
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ============================================================
-- 7. handle_new_user trigger
-- Creates a stub profile row on every new auth signup.
-- Skips the admin real-email account.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  slug_base text;
  new_slug  text;
BEGIN
  -- Skip profile creation for the admin email account
  IF NEW.email = 'loophereinit@protonmail.com' THEN
    RETURN NEW;
  END IF;

  -- Generate a slug from the email prefix (everything before @)
  slug_base := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]+', '-', 'g'));
  new_slug  := slug_base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);

  INSERT INTO public.profiles (user_id, page_slug, is_active)
  VALUES (NEW.id, new_slug, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 8. delete_user() — called by supabase.rpc('delete_user')
-- Deletes all data for the currently authenticated user.
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  DELETE FROM public.store_analytics WHERE store_id = uid;
  DELETE FROM public.reviews         WHERE store_id = uid;
  DELETE FROM public.products        WHERE user_id  = uid;
  DELETE FROM public.profiles        WHERE user_id  = uid;
  DELETE FROM auth.users             WHERE id       = uid;
END;
$$;

-- ============================================================
-- 9. Storage bucket policies
-- Create the bucket manually first:
--   Storage → New bucket → Name: "user-uploads" → Public: ON
-- Then run these policies:
-- ============================================================
CREATE POLICY "Authenticated users upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read user-uploads"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'user-uploads');

CREATE POLICY "Owners delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
