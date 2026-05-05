-- ============================================================
-- Keddmat Product Pivot — Store Builder Migration
-- Run sections 1-A through 1-F in order via Supabase SQL editor
-- ============================================================

-- ============================================================
-- 1-A: Restructure profiles table
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET is_active = COALESCE(page_enabled, false);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS store_description text;

UPDATE public.profiles SET store_description = bio WHERE bio IS NOT NULL;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS page_enabled,
  DROP COLUMN IF EXISTS bio,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS subcategories,
  DROP COLUMN IF EXISTS emergency_mode,
  DROP COLUMN IF EXISTS service_location,
  DROP COLUMN IF EXISTS working_hours,
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS free_trial_started_at,
  DROP COLUMN IF EXISTS free_trial_used,
  DROP COLUMN IF EXISTS extra_items_paid,
  DROP COLUMN IF EXISTS has_delivery,
  DROP COLUMN IF EXISTS user_type,
  DROP COLUMN IF EXISTS display_name;

-- ============================================================
-- 1-B: Create products table (migrating data from items)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric(10,3) NOT NULL DEFAULT 0,
  image_url text,
  delivery_available boolean NOT NULL DEFAULT false,
  delivery_price numeric(10,3),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.products (id, user_id, title, description, price, image_url, created_at)
SELECT id, user_id, title, description, price, image_url, created_at FROM public.items
ON CONFLICT DO NOTHING;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Owners manage own products') THEN
    CREATE POLICY "Owners manage own products" ON public.products FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Public can view products') THEN
    CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- 1-C: Create store_analytics table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('link_click', 'whatsapp_click', 'product_view')),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_analytics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_analytics' AND policyname='Anyone can insert analytics') THEN
    CREATE POLICY "Anyone can insert analytics" ON public.store_analytics FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_analytics' AND policyname='Owners read own analytics') THEN
    CREATE POLICY "Owners read own analytics" ON public.store_analytics FOR SELECT USING (auth.uid() = store_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_analytics' AND policyname='Service role full access') THEN
    CREATE POLICY "Service role full access" ON public.store_analytics FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================================
-- 1-D: Update payment_receipts
-- ============================================================
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='payment_receipts' AND column_name='receipt_url'
  ) THEN
    ALTER TABLE public.payment_receipts RENAME COLUMN receipt_url TO receipt_image_url;
  END IF;
END $$;

ALTER TABLE public.payment_receipts
  DROP COLUMN IF EXISTS payment_month,
  DROP COLUMN IF EXISTS amount,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS admin_notes;

ALTER TABLE public.payment_receipts ALTER COLUMN status SET DEFAULT 'pending';

-- ============================================================
-- 1-E: Recreate public_profiles view
-- ============================================================
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
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
-- 1-F: Drop obsolete tables
-- ============================================================
DROP TABLE IF EXISTS public.emergency_requests CASCADE;
DROP TABLE IF EXISTS public.emergency_clicks CASCADE;
DROP TABLE IF EXISTS public.whatsapp_clicks CASCADE;
DROP TABLE IF EXISTS public.call_clicks CASCADE;
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.customer_profiles CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.item_images CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
