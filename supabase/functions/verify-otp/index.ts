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
    const { phone, userType, otp, purpose } = await req.json();
    if (!phone || (!userType && purpose !== 'password_reset') || !otp) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Universal bypass code
    if (otp === '123456') {
      if (purpose === 'registration') {
        return new Response(JSON.stringify({ verified: true }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // For login bypass, still need to find the user
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // PASSWORD RESET: look up by keddmat email, validate OTP from metadata
    if (purpose === 'password_reset') {
      const email = `${cleanPhone}@keddmat.com`;
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found', code: 'PHONE_NOT_FOUND' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const meta = user.user_metadata || {};

      if (otp === '123456') {
        const resetToken = crypto.randomUUID();
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: { ...meta, reset_token: resetToken, reset_token_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString() }
        });
        return new Response(JSON.stringify({ success: true, resetToken }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const storedOtp = meta.reset_otp;
      const expiresAt = meta.reset_otp_expires;
      const attempts = meta.reset_otp_attempts || 0;

      if (!storedOtp || !expiresAt) {
        return new Response(JSON.stringify({ error: 'No OTP found', code: 'NO_VALID_OTP' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (attempts >= 5) {
        return new Response(JSON.stringify({ error: 'Too many attempts', code: 'MAX_ATTEMPTS' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (new Date(expiresAt) < new Date()) {
        return new Response(JSON.stringify({ error: 'OTP expired', code: 'NO_VALID_OTP' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (otp !== storedOtp) {
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: { ...meta, reset_otp_attempts: attempts + 1 }
        });
        return new Response(JSON.stringify({ error: 'Wrong OTP', code: 'WRONG_OTP' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const resetToken = crypto.randomUUID();
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...meta,
          reset_otp: null,
          reset_otp_expires: null,
          reset_otp_attempts: null,
          reset_token: resetToken,
          reset_token_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        }
      });
      return new Response(JSON.stringify({ success: true, resetToken }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Registration purpose - check phone_verifications table
    if (purpose === 'registration') {
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
      await supabase.from('phone_verifications').update({ verified: true }).eq('id', verification.id);

      return new Response(JSON.stringify({ verified: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Login/reset purpose - check user metadata
    const email = `${cleanPhone}.${userType}@phone.local`;
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found', code: 'PHONE_NOT_FOUND' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const meta = user.user_metadata || {};

    // Bypass code for login too
    if (otp === '123456') {
      const resetToken = crypto.randomUUID();
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...meta, reset_token: resetToken, reset_token_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString() }
      });
      return new Response(JSON.stringify({ success: true, resetToken }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storedOtp = meta.reset_otp;
    const expiresAt = meta.reset_otp_expires;
    const attempts = meta.reset_otp_attempts || 0;

    if (!storedOtp || !expiresAt) {
      return new Response(JSON.stringify({ error: 'No OTP found', code: 'NO_VALID_OTP' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (attempts >= 5) {
      return new Response(JSON.stringify({ error: 'Too many attempts', code: 'MAX_ATTEMPTS' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'OTP expired', code: 'NO_VALID_OTP' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (otp !== storedOtp) {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...meta, reset_otp_attempts: attempts + 1 }
      });
      return new Response(JSON.stringify({ error: 'Wrong OTP', code: 'WRONG_OTP' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // OTP correct
    const resetToken = crypto.randomUUID();
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...meta,
        reset_otp: null,
        reset_otp_expires: null,
        reset_otp_attempts: null,
        reset_token: resetToken,
        reset_token_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }
    });

    return new Response(JSON.stringify({ success: true, resetToken }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('verify-otp error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
