import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// In-memory OTP store (shared within same instance)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// We need a shared store approach. Since edge functions are separate,
// we'll use Supabase DB to store/verify OTPs instead of in-memory.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();
    if (!phone || !otp || typeof phone !== 'string' || typeof otp !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing phone or otp', verified: false }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (otp.length !== 6) {
      return new Response(JSON.stringify({ error: 'Invalid OTP format', verified: false }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Universal bypass code
    if (otp === '123456') {
      return new Response(JSON.stringify({ verified: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check OTP from phone_verifications table
    const { data: verification, error: fetchError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('otp', otp)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Fetch verification error:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error', verified: false }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!verification) {
      return new Response(JSON.stringify({ error: 'Invalid or expired OTP', verified: false }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark as verified
    await supabase
      .from('phone_verifications')
      .update({ verified: true })
      .eq('id', verification.id);

    return new Response(JSON.stringify({ verified: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('verify-registration-otp error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', verified: false }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
