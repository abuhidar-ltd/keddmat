import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, ExternalLink, Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useToast } from '@/hooks/use-toast';
import StoreSettingsForm from '@/components/dashboard/StoreSettingsForm';
import ProductsManager from '@/components/dashboard/ProductsManager';
import AnalyticsTab from '@/components/dashboard/AnalyticsTab';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { language, setLanguage, dir } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [slug, setSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'store');

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/auth', { replace: true });
    else if (user.email === 'loophereinit@protonmail.com') navigate('/admin', { replace: true });
  }, [user, loading]);

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      toast({ title: 'تم الدفع بنجاح! اشتراكك قيد التفعيل ✓' });
      setSearchParams({}, { replace: true });
    } else if (payment === 'cancelled') {
      toast({ title: 'تم إلغاء عملية الدفع', variant: 'destructive' });
      setSearchParams({}, { replace: true });
    }
  }, []);

  const handleUpgradeClick = () => {
    setActiveTab('store');
    setSearchParams({ upgrade: '1' }, { replace: true });
  };

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('page_slug').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => { if (data?.page_slug) setSlug(data.page_slug); });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  if (loading || !user || user.email === 'loophereinit@protonmail.com') {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-purple" /></div>;
  }

  return (
    <div className="min-h-screen bg-brand-surface" dir={dir}>
      <header className="bg-white border-b border-brand-purple/10 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 py-1">
            <BrandLogo height={36} />
          </div>

          <div className="flex items-center gap-2">
            {slug && (
              <a href={`/store/${slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 text-brand-purple border-brand-purple/30 hover:bg-brand-purple/5 rounded-xl font-semibold">
                  <ExternalLink className="h-4 w-4" />
                  متجري
                </Button>
              </a>
            )}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-brand-purple/40 hover:text-brand-purple transition-colors"
            >
              {language === 'ar' ? 'EN' : 'ع'}
            </button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-gray-500 hover:text-red-600 rounded-xl">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white shadow-sm border border-brand-purple/10 p-1 mb-6 h-auto">
            <TabsTrigger value="store" className="rounded-xl py-2.5 font-semibold data-[state=active]:bg-brand-purple data-[state=active]:text-white transition-all">المتجر</TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl py-2.5 font-semibold data-[state=active]:bg-brand-purple data-[state=active]:text-white transition-all">المنتجات</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl py-2.5 font-semibold data-[state=active]:bg-brand-purple data-[state=active]:text-white transition-all">الإحصائيات</TabsTrigger>
          </TabsList>

          <TabsContent value="store">
            <StoreSettingsForm />
          </TabsContent>
          <TabsContent value="products">
            <ProductsManager onUpgradeClick={handleUpgradeClick} />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab onUpgradeClick={handleUpgradeClick} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
