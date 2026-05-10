import Stripe from 'https://esm.sh/stripe@13';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { targetUserId } = await req.json();

    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(targetUserId);

    if (user?.email) {
      // Find and cancel Stripe subscription
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
        if (subscriptions.data.length > 0) {
          await stripe.subscriptions.cancel(subscriptions.data[0].id);
          console.log('Cancelled subscription for:', user.email);
        }
      }
    }

    // Delete from database using admin_delete_user function
    await supabase.rpc('admin_delete_user', { target_user_id: targetUserId });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
