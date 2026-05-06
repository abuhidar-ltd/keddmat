-- ============================================================
-- Keddmat — Complete Schema
-- Run this entire file in a fresh Supabase project SQL editor.
-- ============================================================

-- ============================================================
-- 1. profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name            text,
  store_description     text,
  avatar_url            text,
  cover_url             text,
  page_slug             text UNIQUE,
  whatsapp_number       text,
  phone                 text,
  is_active             boolean NOT NULL DEFAULT false,
  subscription_expires_at timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own profile" ON public.profiles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);

-- ============================================================
-- 2. products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               text NOT NULL,
  description         text,
  price               numeric(10,3) NOT NULL DEFAULT 0,
  image_url           text,
  delivery_available  boolean NOT NULL DEFAULT false,
  delivery_price      numeric(10,3),
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own products" ON public.products FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

-- ============================================================
-- 3. store_analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_analytics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  text NOT NULL CHECK (event_type IN ('link_click', 'whatsapp_click', 'product_view')),
  product_id  uuid REFERENCES public.products(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics" ON public.store_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners read own analytics"   ON public.store_analytics FOR SELECT USING (auth.uid() = store_id);
CREATE POLICY "Service role full access"    ON public.store_analytics FOR ALL TO service_role USING (true);

-- ============================================================
-- 4. payment_receipts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_image_url   text NOT NULL,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own receipts" ON public.payment_receipts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on receipts" ON public.payment_receipts
  FOR ALL TO service_role USING (true);

-- ============================================================
-- 5. phone_verifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  otp         text NOT NULL,
  expires_at  timestamptz NOT NULL,
  verified    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.phone_verifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 6. user_roles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on roles" ON public.user_roles
  FOR ALL TO service_role USING (true);

-- Allow authenticated users to read their own roles (needed by useAdmin hook)
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. public_profiles view
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
  is_active,
  subscription_expires_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ============================================================
-- 8. handle_new_user trigger
-- Creates a minimal stub profile row on every new auth signup.
-- ============================================================
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

-- ============================================================
-- 9. Storage bucket
-- Create the bucket via the Supabase dashboard:
--   Storage → New bucket → Name: "user-uploads" → Public: ON
-- Then run these policies:
-- ============================================================
-- INSERT: authenticated users can upload into their own folder
CREATE POLICY "Authenticated users upload own files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- SELECT: anyone can read (public bucket)
CREATE POLICY "Public read user-uploads"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'user-uploads');

-- DELETE: owners can delete their own files
CREATE POLICY "Owners delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
