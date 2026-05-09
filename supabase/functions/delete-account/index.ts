import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const normalizePhoneDigits = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.replace(/[^0-9]/g, '');
};

const buildPhoneVariants = (cleanPhone: string): Set<string> => {
  const variants = new Set<string>();
  if (!cleanPhone) return variants;

  variants.add(cleanPhone);

  if (cleanPhone.startsWith('962')) {
    const localWithoutCountry = cleanPhone.slice(3);
    if (localWithoutCountry) variants.add(localWithoutCountry);
    if (localWithoutCountry && !localWithoutCountry.startsWith('0')) {
      variants.add(`0${localWithoutCountry}`);
    }
  }

  if (cleanPhone.startsWith('0')) {
    const withoutZero = cleanPhone.slice(1);
    if (withoutZero) {
      variants.add(withoutZero);
      variants.add(`962${withoutZero}`);
    }
  }

  return variants;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the requesting user's identity using their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.user.id;
    const userPhone = normalizePhoneDigits((userData.user as any).phone)
      || normalizePhoneDigits((userData.user.user_metadata as any)?.phone);

    // Admin client for cleanup + auth user deletion
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Delete uploaded files in user-uploads/{userId}/*
    try {
      const { data: storageFiles } = await adminClient.storage.from('user-uploads').list(userId);
      if (storageFiles && storageFiles.length > 0) {
        const filePaths = storageFiles.map((f: any) => `${userId}/${f.name}`);
        await adminClient.storage.from('user-uploads').remove(filePaths);
      }
    } catch (storageError) {
      console.error('Failed to delete storage files for user:', userId, storageError);
    }

    // 2. Delete item_images linked to user's items
    const { data: userItems, error: userItemsError } = await adminClient
      .from('items')
      .select('id')
      .eq('user_id', userId);

    if (userItemsError) {
      console.error('Failed to load items before delete:', userId, userItemsError);
    }

    const itemIds = (userItems || []).map((item: any) => item.id).filter(Boolean);

    if (itemIds.length > 0) {
      const { error: itemImagesError } = await adminClient
        .from('item_images')
        .delete()
        .in('item_id', itemIds);
      if (itemImagesError) {
        console.error('Failed to delete item images:', userId, itemImagesError);
      }
    }

    // 3. Delete all related rows (mirrors delete_merchant in admin-data)
    await adminClient.from('items').delete().eq('user_id', userId);
    await adminClient.from('notifications').delete().eq('user_id', userId);
    await adminClient.from('payment_receipts').delete().eq('user_id', userId);
    await adminClient.from('subscriptions').delete().eq('user_id', userId);
    await adminClient.from('emergency_requests').delete().eq('customer_id', userId);
    await adminClient.from('ratings').delete().eq('merchant_id', userId);
    await adminClient.from('customer_profiles').delete().eq('user_id', userId);
    await adminClient.from('whatsapp_clicks').delete().eq('merchant_id', userId);
    await adminClient.from('call_clicks').delete().eq('merchant_id', userId);
    await adminClient.from('emergency_clicks').delete().eq('merchant_id', userId);
    await adminClient.from('orders').delete().eq('merchant_id', userId);
    await adminClient.from('orders').delete().eq('customer_id', userId);
    await adminClient.from('profiles').delete().eq('user_id', userId);

    // 4. Clear phone verification rows so the user can re-register with the same phone
    if (userPhone) {
      const phoneVariants = Array.from(buildPhoneVariants(userPhone));
      if (phoneVariants.length > 0) {
        await adminClient.from('phone_verifications').delete().in('phone', phoneVariants);
      }
    }

    // 5. Delete the auth user — this is the step that requires the service role
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      const errorMessage = deleteAuthError.message?.toLowerCase?.() || '';
      const isNotFound = errorMessage.includes('not found') || errorMessage.includes('user not found');
      if (!isNotFound) {
        console.error('Failed to delete auth user:', userId, deleteAuthError);
        return new Response(JSON.stringify({ error: 'Failed to delete auth user: ' + deleteAuthError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('delete-account error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
