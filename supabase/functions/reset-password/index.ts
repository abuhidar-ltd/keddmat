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
    const { resetToken, tempPassword, newPassword, userType, phone } = await req.json();
    const providedToken = resetToken ?? tempPassword;

    if (!providedToken || !newPassword || !userType || !phone) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const email = `${cleanPhone}.${userType}@phone.local`;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found', code: 'INVALID_TOKEN' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const meta = user.user_metadata || {};
    if (meta.reset_token !== providedToken) {
      return new Response(JSON.stringify({ error: 'Invalid token', code: 'INVALID_TOKEN' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (meta.reset_token_expires && new Date(meta.reset_token_expires) < new Date()) {
      return new Response(JSON.stringify({ error: 'Token expired', code: 'INVALID_TOKEN' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update password
    await supabase.auth.admin.updateUserById(user.id, { password: newPassword });

    // Clear reset metadata
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...meta,
        reset_token: null,
        reset_token_expires: null,
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('reset-password error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
