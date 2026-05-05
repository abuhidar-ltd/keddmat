-- Monthly subscription: public store visible while is_active and subscription_expires_at > now()

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Existing active merchants keep a 30-day window from migration time
UPDATE public.profiles
SET subscription_expires_at = now() + interval '30 days'
WHERE is_active = true AND subscription_expires_at IS NULL;

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
  is_active,
  subscription_expires_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
