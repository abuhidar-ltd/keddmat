-- Click tracking tables hold non-sensitive counters.
-- Disable RLS so anonymous visitors can insert clicks.
-- Also drop the foreign key on call_clicks.merchant_id so clicks
-- don't fail when a merchant row is missing.

ALTER TABLE public.emergency_clicks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_clicks  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_clicks      DISABLE ROW LEVEL SECURITY;

-- Grant INSERT to anon role (belt-and-suspenders)
GRANT INSERT ON public.emergency_clicks TO anon;
GRANT INSERT ON public.whatsapp_clicks  TO anon;
GRANT INSERT ON public.call_clicks      TO anon;

-- Drop the FK constraint on call_clicks so inserts never fail
-- due to a missing profile row.
ALTER TABLE public.call_clicks
  DROP CONSTRAINT IF EXISTS call_clicks_merchant_id_fkey;
