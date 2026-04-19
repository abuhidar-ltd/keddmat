import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing phone' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      return new Response(JSON.stringify({ error: 'Invalid phone number' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Generate 5-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Delete old OTPs for this phone
    await supabase
      .from('phone_verifications')
      .delete()
      .eq('phone', cleanPhone);

    // Store OTP in DB
    const { error: insertError } = await supabase
      .from('phone_verifications')
      .insert({
        phone: cleanPhone,
        otp,
        expires_at: expiresAt,
        verified: false,
      });

    if (insertError) {
      console.error('Insert OTP error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to store OTP' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send OTP via WhatsApp
    const ULTRAMSG_INSTANCE_ID = Deno.env.get('ULTRAMSG_INSTANCE_ID');
    const ULTRAMSG_TOKEN = Deno.env.get('ULTRAMSG_TOKEN');

    if (!ULTRAMSG_INSTANCE_ID || !ULTRAMSG_TOKEN) {
      console.error('WhatsApp credentials not configured');
      return new Response(JSON.stringify({ error: 'WhatsApp not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const message = `رمز التحقق الخاص بك في منصة خدمات:\n\n${otp}\n\nصالح لمدة 5 دقائق.\nلا تشارك هذا الرمز مع أحد.`;

    const formData = new URLSearchParams();
    formData.append('token', ULTRAMSG_TOKEN);
    formData.append('to', cleanPhone);
    formData.append('body', message);
    formData.append('priority', '10');

    const whatsappRes = await fetch(
      `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData.toString() }
    );
    const whatsappResult = await whatsappRes.json();
    console.log('Registration OTP WhatsApp result:', whatsappResult);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-registration-otp error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
