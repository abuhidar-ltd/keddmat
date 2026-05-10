import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LogOut, Store, Trash2, Users, MessageCircle, Link2, Loader2, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { brand } from '@/lib/brand';
import { BrandLogo } from '@/components/BrandLogo';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

const ADMIN_EMAIL = 'loophereinit@protonmail.com';

interface StoreRow {
  user_id: string;
  store_name: string | null;
  page_slug: string | null;
  whatsapp_number: string | null;
  is_active: boolean;
  created_at: string;
}

const Admin = () => {
  const { language, setLanguage } = useLanguage();
  const [authed, setAuthed] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [stores, setStores] = useState<StoreRow[]>([]);
  const [analytics, setAnalytics] = useState<{ event_type: string; created_at: string }[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoginLoading(false);
    if (error || !data.user) {
      setLoginError('بيانات خاطئة');
      return;
    }
    if (data.user.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setLoginError('غير مصرح لك بالدخول');
      return;
    }
    setAuthed(true);
    fetchData(data.user.id);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthed(false);
    setStores([]);
    setAnalytics([]);
  };

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async (excludeUserId?: string) => {
    setLoadingData(true);
    setFetchError(null);
    const currentUser = (await supabase.auth.getUser()).data.user;
    console.log('Current user:', currentUser?.email);
    const [storesRes, analyticsRes] = await Promise.all([
      supabase.from('profiles')
        .select('*')
        .limit(100)
        .order('created_at', { ascending: false }),
      supabase.from('store_analytics')
        .select('event_type, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    ]);
    console.log('Stores query result:', storesRes.data);
    console.log('Stores error:', storesRes.error);
    if (storesRes.error) setFetchError(storesRes.error.message);
    else if (!storesRes.data?.length) setFetchError('No stores found (empty array) — RLS may be blocking.');
    const allStores = (storesRes.data as StoreRow[]) || [];
    setStores(excludeUserId ? allStores.filter(s => s.user_id !== excludeUserId) : allStores);
    setAnalytics(analyticsRes.data || []);
    setLoadingData(false);
  };

  const toggleActive = async (userId: string, current: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_active: !current }).eq('user_id', userId);
    if (error) { toast.error('فشل التحديث'); return; }
    toast.success(current ? 'تم إيقاف المتجر' : 'تم تفعيل المتجر');
    fetchData();
  };

  const deleteStore = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المتجر بجميع بياناته؟')) return;
    await supabase.from('store_analytics').delete().eq('store_id', userId);
    await supabase.from('products').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);
    toast.success('تم حذف المتجر');
    fetchData();
  };

  const totalStores = stores.length;
  const activeStores = stores.filter(s => s.is_active).length;
  const totalWaClicks = analytics.filter(e => e.event_type === 'whatsapp_click').length;
  const totalLinkClicks = analytics.filter(e => e.event_type === 'link_click').length;

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

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-brand-surface" dir="rtl">
        <Card className="w-full max-w-sm shadow-md rounded-2xl border-0">
          <CardContent className="pt-8 pb-6 px-6 space-y-5">
            <div className="text-center space-y-1">
              <BrandLogo height={48} className="mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">لوحة تحكم خدمات</p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="h-12 text-base rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">كلمة المرور</Label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="h-12 text-base rounded-xl"
                  required
                />
              </div>
              {loginError && <p className="text-sm text-red-500 text-center">{loginError}</p>}
              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full h-12 font-bold text-base rounded-xl text-white bg-gradient-to-br from-brand-purple to-brand-cyan hover:opacity-95"
              >
                {loginLoading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الدخول...</> : 'تسجيل الدخول'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface" dir="rtl">
      <header className="bg-white border-b border-brand-purple/10 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo height={32} />
            <ShieldCheck className="h-5 w-5 text-brand-purple hidden sm:block" />
            <span className="font-extrabold text-gray-900 hidden sm:inline">لوحة الأدمن</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-brand-purple/40 hover:text-brand-purple transition-colors"
            >
              {language === 'ar' ? 'EN' : 'ع'}
            </button>
            <Link to="/"><Button variant="outline" size="sm" className="rounded-xl text-sm">الرئيسية</Button></Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white shadow-sm border border-brand-purple/10 p-1 mb-6 h-auto">
            <TabsTrigger value="overview" className="rounded-xl py-2.5 font-semibold data-[state=active]:bg-brand-purple data-[state=active]:text-white">نظرة عامة</TabsTrigger>
            <TabsTrigger value="stores" className="rounded-xl py-2.5 font-semibold data-[state=active]:bg-brand-purple data-[state=active]:text-white">المتاجر</TabsTrigger>
          </TabsList>

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

          <TabsContent value="stores">
            {loadingData ? (
              <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-purple" /></div>
            ) : (
              <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                {fetchError && (
                  <CardContent className="p-4 bg-red-50 text-red-700 text-sm font-mono break-all">{fetchError}</CardContent>
                )}
                {stores.length === 0 ? (
                  <CardContent className="p-8 text-center text-gray-400">لا توجد متاجر — تحقق من الكونسول</CardContent>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs">
                          <th className="text-right px-4 py-3 font-semibold">المتجر</th>
                          <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">واتساب</th>
                          <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                          <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">تاريخ التسجيل</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {stores.map(store => (
                          <tr key={store.user_id} className="bg-white hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900 truncate max-w-[140px]">{store.store_name || 'بدون اسم'}</p>
                              {store.page_slug && (
                                <p className="text-xs text-gray-400 truncate max-w-[140px]">{store.page_slug}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{store.whatsapp_number || '—'}</td>
                            <td className="px-4 py-3">
                              {store.is_active
                                ? <Badge className="bg-green-100 text-green-700 border-0 text-xs">نشط</Badge>
                                : <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">غير نشط</Badge>}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                              {new Date(store.created_at).toLocaleDateString('ar-EG')}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 justify-end">
                                {store.page_slug && (
                                  <a href={`/store/${store.page_slug}`} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-xs px-2">عرض</Button>
                                  </a>
                                )}
                                <Button
                                  variant="outline" size="sm"
                                  onClick={() => toggleActive(store.user_id, store.is_active)}
                                  className={`rounded-lg h-7 gap-1 text-xs px-2 ${store.is_active ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                >
                                  {store.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                                  {store.is_active ? 'إيقاف' : 'تفعيل'}
                                </Button>
                                <Button
                                  variant="outline" size="sm"
                                  onClick={() => deleteStore(store.user_id)}
                                  className="rounded-lg h-7 text-xs px-2 border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
