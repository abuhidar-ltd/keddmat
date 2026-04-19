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
    const { phone, userType, purpose } = await req.json();
    console.log('send-otp called with:', { phone, userType, purpose });

    if (!phone || !userType) {
      return new Response(JSON.stringify({ error: 'Missing phone or userType' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // REGISTRATION: store OTP in phone_verifications table and send via WhatsApp
    if (purpose === 'registration') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Delete old OTPs for this phone
      await supabase.from('phone_verifications').delete().eq('phone', cleanPhone);

      // Store new OTP
      const { error: insertError } = await supabase.from('phone_verifications').insert({
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

      // Send via WhatsApp
      const message = `رمز التحقق الخاص بك في منصة خدمات:\n\n${otp}\n\nصالح لمدة 10 دقائق.\nلا تشارك هذا الرمز مع أحد.`;
      await sendWhatsApp(cleanPhone, message);

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // LOGIN: check if user exists first
    const email = `${cleanPhone}.${userType}@phone.local`;
    const { data: users } = await supabase.auth.admin.listUsers();
    const userExists = users?.users?.find(u => u.email === email);
    if (!userExists) {
      return new Response(JSON.stringify({ error: 'Phone not found', code: 'PHONE_NOT_FOUND' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate 6-digit OTP and store in user metadata
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await supabase.auth.admin.updateUserById(userExists.id, {
      user_metadata: {
        ...userExists.user_metadata,
        reset_otp: otp,
        reset_otp_expires: expiresAt,
        reset_otp_attempts: 0,
      }
    });

    // Send via WhatsApp
    const message = `🔐 رمز التحقق الخاص بك: ${otp}\n\nصالح لمدة 5 دقائق.\nلا تشارك هذا الرمز مع أحد.`;
    await sendWhatsApp(cleanPhone, message);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-otp error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendWhatsApp(phone: string, message: string) {
  const ULTRAMSG_INSTANCE_ID = Deno.env.get('ULTRAMSG_INSTANCE_ID');
  const ULTRAMSG_TOKEN = Deno.env.get('ULTRAMSG_TOKEN');

  if (!ULTRAMSG_INSTANCE_ID || !ULTRAMSG_TOKEN) {
    throw new Error('WhatsApp credentials not configured');
  }

  const formData = new URLSearchParams();
  formData.append('token', ULTRAMSG_TOKEN);
  formData.append('to', phone);
  formData.append('body', message);
  formData.append('priority', '10');

  const res = await fetch(
    `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData.toString() }
  );
  const result = await res.json();
  console.log('OTP WhatsApp result:', result);
}
