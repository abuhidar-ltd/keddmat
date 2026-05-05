import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LogOut, Store, CreditCard, CheckCircle, XCircle, Trash2, Users, MessageCircle, Link2, Loader2, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { brand } from '@/lib/brand';
import { BrandLogo } from '@/components/BrandLogo';
import { computeRenewedExpiry, isPublicStoreVisible, SUBSCRIPTION_PERIOD_DAYS } from '@/lib/subscription';
import { toast } from 'sonner';

interface StoreRow {
  user_id: string;
  store_name: string | null;
  page_slug: string | null;
  whatsapp_number: string | null;
  is_active: boolean;
  subscription_expires_at: string | null;
  created_at: string;
}

interface ReceiptRow {
  id: string;
  user_id: string;
  receipt_image_url: string;
  status: string;
  created_at: string;
  store_name?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [stores, setStores] = useState<StoreRow[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [analytics, setAnalytics] = useState<{ event_type: string; created_at: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('غير مصرح لك بالدخول');
      navigate('/');
    }
  }, [isAdmin, adminLoading]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    const [storesRes, receiptsRes, analyticsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, store_name, page_slug, whatsapp_number, is_active, subscription_expires_at, created_at').order('created_at', { ascending: false }),
      supabase.from('payment_receipts').select('*').order('created_at', { ascending: false }),
      supabase.from('store_analytics').select('event_type, created_at').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    ]);

    setStores((storesRes.data as StoreRow[]) || []);

    // Enrich receipts with store name
    const rawReceipts = (receiptsRes.data as ReceiptRow[]) || [];
    const enriched = rawReceipts.map(r => ({
      ...r,
      store_name: (storesRes.data as StoreRow[])?.find(s => s.user_id === r.user_id)?.store_name || 'غير معروف',
    }));
    setReceipts(enriched);

    setAnalytics(analyticsRes.data || []);
    setLoadingData(false);
  };

  const toggleActive = async (userId: string, current: boolean) => {
    if (!current) {
      const next = computeRenewedExpiry(null);
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true, subscription_expires_at: next })
        .eq('user_id', userId);
      if (error) { toast.error('فشل التحديث'); return; }
      toast.success(`تم تفعيل المتجر — اشتراك ${SUBSCRIPTION_PERIOD_DAYS} يوماً`);
    } else {
      const { error } = await supabase.from('profiles').update({ is_active: false }).eq('user_id', userId);
      if (error) { toast.error('فشل التحديث'); return; }
      toast.success('تم إيقاف المتجر');
    }
    fetchData();
  };

  const deleteStore = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المتجر بجميع بياناته؟')) return;
    await supabase.from('products').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);
    toast.success('تم حذف المتجر');
    fetchData();
  };

  const approveReceipt = async (receiptId: string, userId: string) => {
    const { data: prof } = await supabase.from('profiles').select('subscription_expires_at').eq('user_id', userId).maybeSingle();
    const nextExpiry = computeRenewedExpiry(prof?.subscription_expires_at ?? null);
    await supabase.from('payment_receipts').update({ status: 'approved' }).eq('id', receiptId);
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: true, subscription_expires_at: nextExpiry })
      .eq('user_id', userId);
    if (error) {
      toast.error('فشل تحديث الاشتراك');
      return;
    }
    toast.success(`تم قبول الوصل — تمديد ${SUBSCRIPTION_PERIOD_DAYS} يوماً`);
    fetchData();
  };

  const rejectReceipt = async (receiptId: string) => {
    await supabase.from('payment_receipts').update({ status: 'rejected' }).eq('id', receiptId);
    toast.success('تم رفض الوصل');
    fetchData();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // KPIs
  const totalStores = stores.length;
  const activeStores = stores.filter(s =>
    isPublicStoreVisible({ is_active: s.is_active, subscription_expires_at: s.subscription_expires_at }),
  ).length;
  const totalWaClicks = analytics.filter(e => e.event_type === 'whatsapp_click').length;
  const totalLinkClicks = analytics.filter(e => e.event_type === 'link_click').length;
  const pendingReceipts = receipts.filter(r => r.status === 'pending').length;

  // Signups chart (last 30 days)
  const signupChart = (() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    stores.forEach(s => {
      const key = s.created_at?.slice(0, 10);
      if (key && days[key] !== undefined) days[key]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date: date.slice(5), تسجيل: count }));
  })();

  if (adminLoading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-purple" /></div>;
  }

  return (
    <div className="min-h-screen bg-brand-surface" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-brand-purple/10 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo height={32} />
            <ShieldCheck className="h-5 w-5 text-brand-purple hidden sm:block" />
            <span className="font-extrabold text-gray-900 hidden sm:inline">لوحة الأدمن</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/"><Button variant="outline" size="sm" className="rounded-xl text-sm">الرئيسية</Button></Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white shadow-sm border border-brand-purple/10 p-1 mb-6 h-auto">
            <TabsTrigger value="overview" className="rounded-xl py-2.5 font-semibold data-[state=active]:bg-brand-purple data-[state=active]:text-white">نظرة عامة</TabsTrigger>
            <TabsTrigger value="stores" className="rounded-xl py-2.5 font-semibold data-[state=active]:bg-brand-purple data-[state=active]:text-white">المتاجر</TabsTrigger>
            <TabsTrigger value="payments" className="rounded-xl py-2.5 font-semibold data-[state=active]:bg-brand-purple data-[state=active]:text-white">
              المدفوعات {pendingReceipts > 0 && <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs mr-1">{pendingReceipts}</span>}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'إجمالي المتاجر', value: totalStores, icon: <Store className="h-5 w-5 text-brand-purple" />, bg: 'from-violet-50' },
                { label: 'متاجر نشطة', value: activeStores, icon: <Users className="h-5 w-5 text-blue-600" />, bg: 'from-blue-50' },
                { label: 'نقرات واتساب', value: totalWaClicks, icon: <MessageCircle className="h-5 w-5 text-brand-cyan" />, bg: 'from-cyan-50' },
                { label: 'زيارات الرابط', value: totalLinkClicks, icon: <Link2 className="h-5 w-5 text-brand-purple" />, bg: 'from-violet-50' },
              ].map((stat, i) => (
                <Card key={i} className={`border-0 shadow-md rounded-2xl bg-gradient-to-br ${stat.bg} to-white`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white shadow-sm">{stat.icon}</div>
                    <div>
                      <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-0 shadow-md rounded-2xl">
              <CardHeader><CardTitle className="text-base font-bold">تسجيلات جديدة — آخر 30 يوماً</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={signupChart} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="تسجيل" fill={brand.purple} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stores Tab */}
          <TabsContent value="stores">
            {loadingData ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-purple" /></div> : (
              <div className="space-y-3">
                {stores.length === 0 && <p className="text-center text-gray-400 py-10">لا توجد متاجر بعد</p>}
                {stores.map(store => {
                  const pub = isPublicStoreVisible({
                    is_active: store.is_active,
                    subscription_expires_at: store.subscription_expires_at,
                  });
                  const exp = store.subscription_expires_at
                    ? new Date(store.subscription_expires_at).toLocaleDateString('ar-EG')
                    : null;
                  return (
                  <Card key={store.user_id} className="border-0 shadow-sm rounded-2xl bg-white">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{store.store_name || 'بدون اسم'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{store.whatsapp_number} • {store.page_slug}</p>
                        <p className="text-xs text-gray-400">{new Date(store.created_at).toLocaleDateString('ar-EG')}</p>
                        {exp && (
                          <p className="text-xs text-brand-purple mt-1">ينتهي الاشتراك: {exp}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {pub ? (
                          <Badge className="bg-green-100 text-green-700 border-0">ظاهر للزوار</Badge>
                        ) : store.is_active ? (
                          <Badge className="bg-amber-100 text-amber-800 border-0">غير ظاهر (منتهي؟)</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 border-0">غير نشط</Badge>
                        )}
                        {store.page_slug && pub && (
                          <a href={`/store/${store.page_slug}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs">عرض</Button>
                          </a>
                        )}
                        <Button
                          variant="outline" size="sm"
                          onClick={() => toggleActive(store.user_id, store.is_active)}
                          className={`rounded-xl h-8 gap-1 text-xs ${store.is_active ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                        >
                          {store.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                          {store.is_active ? 'إيقاف' : 'تفعيل'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteStore(store.user_id)}
                          className="rounded-xl h-8 gap-1 text-xs border-red-200 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
                })}
              </div>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            {loadingData ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-purple" /></div> : (
              <div className="space-y-3">
                {receipts.length === 0 && <p className="text-center text-gray-400 py-10">لا توجد وصولات بعد</p>}
                {receipts.map(r => (
                  <Card key={r.id} className="border-0 shadow-sm rounded-2xl bg-white">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <a href={r.receipt_image_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <img src={r.receipt_image_url} alt="receipt" className="w-16 h-16 rounded-xl object-cover border hover:opacity-80 transition-opacity" />
                      </a>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900">{r.store_name}</p>
                        <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => approveReceipt(r.id, r.user_id)}
                              className="gap-1 rounded-xl h-8 text-xs bg-green-600 hover:bg-green-700 text-white">
                              <CheckCircle className="h-3.5 w-3.5" />قبول
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => rejectReceipt(r.id)}
                              className="gap-1 rounded-xl h-8 text-xs border-red-200 text-red-600 hover:bg-red-50">
                              <XCircle className="h-3.5 w-3.5" />رفض
                            </Button>
                          </>
                        )}
                        {r.status === 'approved' && <Badge className="bg-green-100 text-green-700 border-0">مقبول</Badge>}
                        {r.status === 'rejected' && <Badge className="bg-red-100 text-red-700 border-0">مرفوض</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
