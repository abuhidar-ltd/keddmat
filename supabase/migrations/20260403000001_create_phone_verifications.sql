CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) full access, no public access
CREATE POLICY "Service role only" ON public.phone_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
