import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, LogOut, ExternalLink, Loader2 } from 'lucide-react';
import StoreSettingsForm from '@/components/dashboard/StoreSettingsForm';
import ProductsManager from '@/components/dashboard/ProductsManager';
import AnalyticsTab from '@/components/dashboard/AnalyticsTab';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth', { replace: true });
  }, [user, loading]);

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

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#2D7D46]" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F7FAF8]" dir="rtl">
      {/* Dashboard header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Right: logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2D7D46, #00BCD4)' }}>
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold text-gray-900">كدامات</span>
          </div>

          {/* Left: actions */}
          <div className="flex items-center gap-2">
            {slug && (
              <a href={`/store/${slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 text-[#2D7D46] border-[#2D7D46]/30 hover:bg-[#2D7D46]/5 rounded-xl font-semibold">
                  <ExternalLink className="h-4 w-4" />
                  متجري
                </Button>
              </a>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-gray-500 hover:text-red-600 rounded-xl">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <Tabs defaultValue="store" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white shadow-sm border border-gray-100 p-1 mb-6 h-auto">
            <TabsTrigger value="store" className="rounded-xl py-2.5 font-semibold data-[state=active]:bg-[#2D7D46] data-[state=active]:text-white transition-all">المتجر</TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl py-2.5 font-semibold data-[state=active]:bg-[#2D7D46] data-[state=active]:text-white transition-all">المنتجات</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl py-2.5 font-semibold data-[state=active]:bg-[#2D7D46] data-[state=active]:text-white transition-all">الإحصائيات</TabsTrigger>
          </TabsList>

          <TabsContent value="store">
            <StoreSettingsForm />
          </TabsContent>
          <TabsContent value="products">
            <ProductsManager />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
