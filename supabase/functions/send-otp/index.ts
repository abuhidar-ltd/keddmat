import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    const cleanPhone = phone.replace(/\D/g, '');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('otp_codes').upsert({
      phone: cleanPhone,
      code: otp,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    });

    console.log('Stored OTP for cleanPhone:', cleanPhone);

    const instanceId = Deno.env.get('ULTRAMSG_INSTANCE_ID');
    const token = Deno.env.get('ULTRAMSG_TOKEN');

    const formData = new URLSearchParams();
    formData.append('token', token!);
    formData.append('to', phone);
    formData.append('body', `مرحباً بك في خدمات 🛍️\n\nرمز التحقق الخاص بك هو: *${otp}*\n\nصالح لمدة 5 دقائق. لا تشاركه مع أحد.`);

    const response = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const result = await response.json();
    console.log('UltraMSG response:', result);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('send-otp error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
