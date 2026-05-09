import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-password, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const ADMIN_PASSWORD = "12345678";
const FUNCTION_VERSION = "v6-emergency-" + Date.now() + "-" + Math.random();
console.log('[admin-data v6] EMERGENCY TRACKING ENABLED', FUNCTION_VERSION);

const PHONE_EMAIL_SUFFIXES = [
  '.merchant@phone.local',
  '.customer@phone.local',
  '.merchant@phone-user.app',
  '.customer@phone-user.app',
  '@phone.local',
  '@phone-user.app',
];

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

const buildCandidateEmails = (phoneVariants: Set<string>): Set<string> => {
  const emails = new Set<string>();
  for (const phone of phoneVariants) {
    for (const suffix of PHONE_EMAIL_SUFFIXES) {
      emails.add(`${phone}${suffix}`.toLowerCase());
    }
  }
  return emails;
};

const collectAuthUsersByPhone = async (
  supabase: ReturnType<typeof createClient>,
  phoneVariants: Set<string>,
  candidateEmails: Set<string>
): Promise<Set<string>> => {
  const matchedUserIds = new Set<string>();
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 20) {
    const { data: usersPage, error: listUsersError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (listUsersError) {
      console.error('Failed to list users for cleanup:', listUsersError);
      break;
    }

    const users = usersPage?.users || [];

    for (const user of users) {
      const email = typeof user.email === 'string' ? user.email.toLowerCase() : '';
      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
      const metadataPhone = normalizePhoneDigits(metadata.phone);
      const userPhone = normalizePhoneDigits((user as any).phone);

      if (
        candidateEmails.has(email) ||
        (metadataPhone && phoneVariants.has(metadataPhone)) ||
        (userPhone && phoneVariants.has(userPhone))
      ) {
        matchedUserIds.add(user.id);
      }
    }

    hasMore = users.length === 1000;
    page += 1;
  }

  return matchedUserIds;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const adminPassword = req.headers.get('x-admin-password');
  if (adminPassword !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const action = url.searchParams.get('action');

      if (action === 'fetch') {
        // Fetch profiles
        const merchantsRes = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        const receiptsRes = await supabase.from('payment_receipts').select('*').order('created_at', { ascending: false });
        const productsRes = await supabase.from('items').select('id, title, price, image_url, user_id, is_active').order('created_at', { ascending: false });
        const ratingsRes = await supabase.from('ratings').select('id, merchant_id, customer_name, rating, comment, created_at').order('created_at', { ascending: false });

        // KPI counts
        const { count: customersCount } = await supabase.from('customer_profiles').select('id', { count: 'exact', head: true });
        const { count: whatsappClicksCount } = await supabase.from('whatsapp_clicks').select('id', { count: 'exact', head: true });
        const { count: callClicksCount } = await supabase.from('call_clicks').select('id', { count: 'exact', head: true });

        // Per-merchant whatsapp & call clicks from dedicated tables
        const { data: waClickRows } = await supabase.from('whatsapp_clicks').select('merchant_id');
        const waClicksByUser: Record<string, number> = {};
        for (const row of (waClickRows || [])) {
          const uid = (row as any).merchant_id;
          if (uid) waClicksByUser[uid] = (waClicksByUser[uid] || 0) + 1;
        }
        const { data: callClickRows } = await supabase.from('call_clicks').select('merchant_id');
        const callClicksByUser: Record<string, number> = {};
        for (const row of (callClickRows || [])) {
          const uid = (row as any).merchant_id;
          if (uid) callClicksByUser[uid] = (callClicksByUser[uid] || 0) + 1;
        }

        // Emergency clicks per merchant from dedicated table (customer clicks on emergency request)
        const { data: emergencyClickRows } = await supabase
          .from('emergency_clicks')
          .select('merchant_id, click_type, created_at');
        const emergencyClicksByUser: Record<string, number> = {};
        const emergencyWhatsappByUser: Record<string, number> = {};
        const emergencyPhoneByUser: Record<string, number> = {};
        const emergencyByDay: Record<string, { whatsapp: number; phone: number }> = {};
        for (const row of (emergencyClickRows || [])) {
          const uid = (row as any).merchant_id;
          const ct = (row as any).click_type || 'whatsapp';
          const createdAt = (row as any).created_at;
          if (uid) {
            emergencyClicksByUser[uid] = (emergencyClicksByUser[uid] || 0) + 1;
            if (ct === 'phone') emergencyPhoneByUser[uid] = (emergencyPhoneByUser[uid] || 0) + 1;
            else emergencyWhatsappByUser[uid] = (emergencyWhatsappByUser[uid] || 0) + 1;
          }
          if (createdAt) {
            const day = new Date(createdAt).toISOString().slice(0, 10);
            if (!emergencyByDay[day]) emergencyByDay[day] = { whatsapp: 0, phone: 0 };
            if (ct === 'phone') emergencyByDay[day].phone += 1;
            else emergencyByDay[day].whatsapp += 1;
          }
        }
        const totalEmergencyClicks = Object.values(emergencyClicksByUser).reduce((a, b) => a + b, 0);
        const totalEmergencyWhatsapp = Object.values(emergencyWhatsappByUser).reduce((a, b) => a + b, 0);
        const totalEmergencyPhone = Object.values(emergencyPhoneByUser).reduce((a, b) => a + b, 0);

        // Build last 30 days series (oldest -> newest)
        const emergencyDaily: Array<{ date: string; whatsapp: number; phone: number; total: number }> = [];
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        for (let i = 29; i >= 0; i--) {
          const d = new Date(today);
          d.setUTCDate(today.getUTCDate() - i);
          const key = d.toISOString().slice(0, 10);
          const entry = emergencyByDay[key] || { whatsapp: 0, phone: 0 };
          emergencyDaily.push({ date: key, whatsapp: entry.whatsapp, phone: entry.phone, total: entry.whatsapp + entry.phone });
        }

        // Map merchants
        const merchants = (merchantsRes.data || []).map((m: any) => ({
          id: m.id, user_id: m.user_id, display_name: m.display_name, store_name: m.store_name || null,
          phone: m.phone, page_enabled: m.page_enabled, page_slug: m.page_slug, created_at: m.created_at,
          whatsapp_clicks: waClicksByUser[m.user_id] || 0,
          call_clicks: callClicksByUser[m.user_id] || 0,
          category: m.category || null, address: m.address || null,
          emergency_clicks: emergencyClicksByUser[m.user_id] || 0,
          emergency_whatsapp_clicks: emergencyWhatsappByUser[m.user_id] || 0,
          emergency_phone_clicks: emergencyPhoneByUser[m.user_id] || 0,
        }));

        // Enrich receipts with merchant info
        const receipts = receiptsRes.data || [];
        const enrichedReceipts = await Promise.all(receipts.map(async (r: any) => {
          const { data: profile } = await supabase.from('profiles').select('display_name, phone').eq('user_id', r.user_id).maybeSingle();
          return {
            id: r.id, user_id: r.user_id, receipt_url: r.receipt_url, amount: r.amount, currency: r.currency,
            status: r.status, payment_month: r.payment_month, created_at: r.created_at,
            payment_type: r.payment_type || 'subscription',
            merchant_name: profile?.display_name || 'غير معروف', merchant_phone: profile?.phone || '',
          };
        }));

        // Enrich products
        const products = productsRes.data || [];
        const enrichedProducts = await Promise.all(products.map(async (p: any) => {
          const { data: profile } = await supabase.from('profiles').select('display_name').eq('user_id', p.user_id).maybeSingle();
          return { ...p, merchant_name: profile?.display_name || '' };
        }));

        return new Response(JSON.stringify({
          merchants, receipts: enrichedReceipts, products: enrichedProducts, ratings: ratingsRes.data || [],
          emergencyDaily,
          kpis: {
            customers: customersCount || 0,
            craftsmen: merchants.length,
            whatsappClicks: whatsappClicksCount || 0,
            callClicks: callClicksCount || 0,
            emergencyClicks: totalEmergencyClicks,
            emergencyWhatsappClicks: totalEmergencyWhatsapp,
            emergencyPhoneClicks: totalEmergencyPhone,
          },
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (req.method === 'POST') {
      const { type, data } = await req.json();

      if (type === 'toggle_store') {
        const newStatus = !data.page_enabled;
        await supabase.from('profiles').update({ page_enabled: newStatus }).eq('id', data.id);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (type === 'review_receipt') {
        await supabase.from('payment_receipts').update({ status: data.approved ? 'approved' : 'rejected' }).eq('id', data.id);
        if (data.approved) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          await supabase.from('subscriptions').upsert({
            user_id: data.user_id,
            status: 'active',
            expires_at: nextMonth.toISOString(),
          });
          await supabase.from('profiles').update({ page_enabled: true }).eq('user_id', data.user_id);
          await supabase.from('notifications').insert({
            user_id: data.user_id,
            title: '✅ تم قبول إيصال الدفع',
            message: 'تم تفعيل اشتراكك بنجاح! متجرك الآن مفعّل.',
            type: 'payment',
          });
        } else {
          await supabase.from('notifications').insert({
            user_id: data.user_id,
            title: '❌ تم رفض إيصال الدفع',
            message: 'تم رفض إيصال الدفع. يرجى التواصل مع الدعم.',
            type: 'payment',
          });
        }
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (type === 'delete_product') {
        await supabase.from('items').delete().eq('id', data.id);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (type === 'delete_merchant') {
        const userIds = new Set<string>();
        const rawPhones = new Set<string>();

        if (typeof data.user_id === 'string' && data.user_id) userIds.add(data.user_id);
        if (typeof data.phone === 'string' && data.phone) rawPhones.add(data.phone);

        if (typeof data.id === 'string' && data.id) {
          const { data: profileById } = await supabase
            .from('profiles')
            .select('user_id, phone')
            .eq('id', data.id)
            .maybeSingle();

          if (profileById?.user_id) userIds.add(profileById.user_id);
          if (typeof profileById?.phone === 'string' && profileById.phone) rawPhones.add(profileById.phone);
        }

        const phoneVariants = new Set<string>();
        for (const rawPhone of rawPhones) {
          const normalized = normalizePhoneDigits(rawPhone);
          const variants = buildPhoneVariants(normalized);
          variants.forEach((v) => phoneVariants.add(v));
        }

        const candidateEmails = buildCandidateEmails(phoneVariants);

        if (phoneVariants.size > 0 || candidateEmails.size > 0) {
          const matchedUserIds = await collectAuthUsersByPhone(supabase, phoneVariants, candidateEmails);
          matchedUserIds.forEach((uid) => userIds.add(uid));
        }

        if (userIds.size === 0) {
          return new Response(JSON.stringify({ error: 'Unable to find linked auth user. Please try again with a valid phone/user_id.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const failedFirstDelete: string[] = [];
        for (const uid of userIds) {
          const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(uid);
          const errorMessage = deleteAuthError?.message?.toLowerCase?.() || '';
          const isNotFound = errorMessage.includes('not found') || errorMessage.includes('user not found');
          if (deleteAuthError && !isNotFound) failedFirstDelete.push(uid);
        }

        // Delete related data + storage files
        for (const uid of userIds) {
          // Delete uploaded files from storage
          try {
            const { data: storageFiles } = await supabase.storage.from('user-uploads').list(uid);
            if (storageFiles && storageFiles.length > 0) {
              const filePaths = storageFiles.map((f: any) => `${uid}/${f.name}`);
              await supabase.storage.from('user-uploads').remove(filePaths);
            }
          } catch (storageError) {
            console.error('Failed to delete storage files for user:', uid, storageError);
          }

          const { data: userItems, error: userItemsError } = await supabase
            .from('items')
            .select('id')
            .eq('user_id', uid);

          if (userItemsError) {
            console.error('Failed to load items before delete:', uid, userItemsError);
          }

          const itemIds = (userItems || []).map((item: any) => item.id).filter(Boolean);

          if (itemIds.length > 0) {
            const { error: itemImagesError } = await supabase.from('item_images').delete().in('item_id', itemIds);
            if (itemImagesError) {
              console.error('Failed to delete item images:', uid, itemImagesError);
            }
          }

          await supabase.from('items').delete().eq('user_id', uid);
          await supabase.from('notifications').delete().eq('user_id', uid);
          await supabase.from('payment_receipts').delete().eq('user_id', uid);
          await supabase.from('subscriptions').delete().eq('user_id', uid);
          await supabase.from('emergency_requests').delete().eq('customer_id', uid);
          await supabase.from('ratings').delete().eq('merchant_id', uid);
          await supabase.from('customer_profiles').delete().eq('user_id', uid);
          await supabase.from('whatsapp_clicks').delete().eq('merchant_id', uid);
          await supabase.from('call_clicks').delete().eq('merchant_id', uid);
          await supabase.from('emergency_clicks').delete().eq('merchant_id', uid);
          await supabase.from('orders').delete().eq('merchant_id', uid);
          await supabase.from('orders').delete().eq('customer_id', uid);
          await supabase.from('profiles').delete().eq('user_id', uid);
        }

        const normalizedPhones = Array.from(rawPhones)
          .map(normalizePhoneDigits)
          .filter(Boolean)
          .flatMap((phone) => Array.from(buildPhoneVariants(phone)));

        if (normalizedPhones.length > 0) {
          const uniquePhones = Array.from(new Set(normalizedPhones));
          await supabase.from('phone_verifications').delete().in('phone', uniquePhones);
        }

        if (data.id) {
          await supabase.from('profiles').delete().eq('id', data.id);
        }

        // Retry auth delete after cleanup if first attempt failed
        for (const uid of failedFirstDelete) {
          const { error: retryDeleteError } = await supabase.auth.admin.deleteUser(uid);
          const errorMessage = retryDeleteError?.message?.toLowerCase?.() || '';
          const isNotFound = errorMessage.includes('not found') || errorMessage.includes('user not found');
          if (retryDeleteError && !isNotFound) {
            console.error('Failed to delete auth user after retry:', retryDeleteError);
            return new Response(JSON.stringify({ error: 'Failed to delete auth user: ' + retryDeleteError.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (type === 'delete_rating') {
        await supabase.from('ratings').delete().eq('id', data.id);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (type === 'delete_all_accounts') {
        let deletedCount = 0;

        // Get all profiles
        const { data: allProfiles } = await supabase.from('profiles').select('user_id, phone');
        const { data: allCustomers } = await supabase.from('customer_profiles').select('user_id, phone');

        const allUserIds = new Set<string>();
        const allPhones = new Set<string>();

        for (const p of (allProfiles || [])) {
          if (p.user_id) allUserIds.add(p.user_id);
          if (p.phone) allPhones.add(normalizePhoneDigits(p.phone));
        }
        for (const c of (allCustomers || [])) {
          if (c.user_id) allUserIds.add(c.user_id);
          if (c.phone) allPhones.add(normalizePhoneDigits(c.phone));
        }

        // Also find all auth users
        let page = 1;
        let hasMore = true;
        while (hasMore && page <= 50) {
          const { data: usersPage, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
          if (error) break;
          const users = usersPage?.users || [];
          for (const u of users) {
            allUserIds.add(u.id);
          }
          hasMore = users.length === 1000;
          page++;
        }

        // Delete all data from all tables
        await supabase.from('item_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('payment_receipts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('subscriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('emergency_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('ratings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('customer_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('whatsapp_clicks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('call_clicks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('emergency_clicks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('phone_verifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Delete all auth users
        for (const uid of allUserIds) {
          const { error } = await supabase.auth.admin.deleteUser(uid);
          if (!error) deletedCount++;
          else {
            const msg = error.message?.toLowerCase() || '';
            if (!msg.includes('not found')) console.error('Failed to delete auth user:', uid, error);
          }
        }

        // Clean storage
        for (const uid of allUserIds) {
          try {
            const { data: files } = await supabase.storage.from('user-uploads').list(uid);
            if (files && files.length > 0) {
              await supabase.storage.from('user-uploads').remove(files.map((f: any) => `${uid}/${f.name}`));
            }
          } catch (_) {}
        }

        return new Response(JSON.stringify({ success: true, deleted: deletedCount }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin function error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});