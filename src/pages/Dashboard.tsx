import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Package, CreditCard, Star, AlertTriangle, Store, ShieldCheck } from 'lucide-react';
import ProfileForm from '@/components/dashboard/ProfileForm';
import ItemsManager from '@/components/dashboard/ItemsManager';
import PaymentManager from '@/components/dashboard/PaymentManager';
import TrialCountdown from '@/components/dashboard/TrialCountdown';

import RatingStars from '@/components/RatingStars';
import EmergencyOrders from '@/components/dashboard/EmergencyOrders';
import AdminPanel from '@/components/dashboard/AdminPanel';
import { isEmergencyCategory } from '@/lib/categoryIcons';

const ADMIN_PHONES = ["962796830150", "0796830150", "796830150", "962795666185", "962799126390", "962778591981", "778591981", "1234567891011", "123456", "123456789"];
const cleanPhone = (phone: string) => phone.replace(/[^0-9]/g, '');

interface Rating {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, signOut } = useAuth();
  const { t, language } = useLanguage();
  const initialTab = searchParams.get('tab') || 'items';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [pageSlug, setPageSlug] = useState<string | null>(null);
  const [merchantCategory, setMerchantCategory] = useState<string | null>(null);
  const [isAdminPhone, setIsAdminPhone] = useState(false);

  const canReceiveEmergency = merchantCategory ? isEmergencyCategory(merchantCategory) : false;

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('page_slug, category, phone').eq('user_id', user.id).maybeSingle().then(async ({ data }) => {
        if (data?.page_slug) setPageSlug(data.page_slug);
        if (data?.category) setMerchantCategory(data.category);
        // Check admin phone
        if (data?.phone) {
          const cleaned = cleanPhone(data.phone);
          if (ADMIN_PHONES.some(p => cleaned.includes(p) || p.includes(cleaned))) { setIsAdminPhone(true); return; }
        }
        const { data: customerProfile } = await supabase.from('customer_profiles').select('phone').eq('user_id', user.id).maybeSingle();
        if (customerProfile?.phone) {
          const cleaned = cleanPhone(customerProfile.phone);
          if (ADMIN_PHONES.some(p => cleaned.includes(p) || p.includes(cleaned))) { setIsAdminPhone(true); return; }
        }
        setIsAdminPhone(false);
      });
    }
  }, [user]);

  const handleNavigateToPayment = () => { setActiveTab('payments'); };

  useEffect(() => {
    if (!loading && !user) {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'emergency') navigate('/auth?type=merchant');
      else navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => { if (user) fetchRatings(); }, [user]);

  const fetchRatings = async () => {
    if (!user) return;
    const { data } = await supabase.from('ratings').select('*').eq('merchant_id', user.id).order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setRatings(data as Rating[]);
      const avg = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length;
      setAvgRating(Math.round(avg * 10) / 10);
    }
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#165B91]"></div>
      </div>
    );
  }

  if (!user) return null;

  // Calculate tab count dynamically
  let tabCount = 4; // items, ratings, payments, profile
  if (canReceiveEmergency) tabCount++;
  if (isAdminPhone) tabCount++;

  return (
    <div className="min-h-screen bg-[#EFF3F8]">
      {/* Dashboard header */}
      <header className="bg-white border-b border-[#E5E7EB] shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4">
          <h1 className="font-extrabold text-lg text-[#165B91]">{t('dashboard.title')}</h1>
          <div className="flex items-center gap-2">
            {pageSlug && (
              <Button variant="outline" size="sm" asChild className="border-[#165B91] text-[#165B91] hover:bg-[#165B91]/5">
                <Link to={`/p/${pageSlug}`}>
                  <Store className="h-4 w-4 ml-1" />
                  {language === 'ar' ? 'متجري' : 'My Store'}
                </Link>
              </Button>
            )}
            <Button variant="ghost" onClick={handleSignOut} className="text-[#6B7280] hover:text-[#1A1A2E]">
              <LogOut className="ml-2 h-4 w-4" />
              {t('dashboard.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 px-4">
        <div className="max-w-2xl mx-auto mb-6">
          <TrialCountdown />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full max-w-xl mx-auto mb-6 bg-white border border-[#E5E7EB] rounded-2xl p-1 shadow-sm ${tabCount === 6 ? 'grid-cols-6' : tabCount === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
            {canReceiveEmergency && (
              <TabsTrigger value="emergency" className="flex flex-col items-center gap-0.5 py-2 text-[10px] sm:flex-row sm:gap-2 sm:text-sm rounded-xl data-[state=active]:bg-[#165B91] data-[state=active]:text-white data-[state=active]:shadow-md">
                <AlertTriangle className="h-4 w-4" />
                <span>{language === 'ar' ? 'طوارئ' : 'Urgent'}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="items" className="flex flex-col items-center gap-0.5 py-2 text-[10px] sm:flex-row sm:gap-2 sm:text-sm rounded-xl data-[state=active]:bg-[#165B91] data-[state=active]:text-white data-[state=active]:shadow-md">
              <Package className="h-4 w-4" />
              <span>{language === 'ar' ? 'أعمالنا' : 'Work'}</span>
            </TabsTrigger>
            <TabsTrigger value="ratings" className="flex flex-col items-center gap-0.5 py-2 text-[10px] sm:flex-row sm:gap-2 sm:text-sm rounded-xl data-[state=active]:bg-[#165B91] data-[state=active]:text-white data-[state=active]:shadow-md">
              <Star className="h-4 w-4" />
              <span>{language === 'ar' ? 'التقييم' : 'Ratings'}</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex flex-col items-center gap-0.5 py-2 text-[10px] sm:flex-row sm:gap-2 sm:text-sm rounded-xl data-[state=active]:bg-[#165B91] data-[state=active]:text-white data-[state=active]:shadow-md">
              <CreditCard className="h-4 w-4" />
              <span>{language === 'ar' ? 'الدفع' : 'Pay'}</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col items-center gap-0.5 py-2 text-[10px] sm:flex-row sm:gap-2 sm:text-sm rounded-xl data-[state=active]:bg-[#165B91] data-[state=active]:text-white data-[state=active]:shadow-md">
              <User className="h-4 w-4" />
              <span>{language === 'ar' ? 'الملف' : 'Profile'}</span>
            </TabsTrigger>
            {isAdminPhone && (
              <TabsTrigger value="admin" className="flex flex-col items-center gap-0.5 py-2 text-[10px] sm:flex-row sm:gap-2 sm:text-sm rounded-xl data-[state=active]:bg-[#165B91] data-[state=active]:text-white data-[state=active]:shadow-md">
                <ShieldCheck className="h-4 w-4" />
                <span>{language === 'ar' ? 'الإدارة' : 'Admin'}</span>
              </TabsTrigger>
            )}
          </TabsList>

          {canReceiveEmergency && (
            <TabsContent value="emergency" className="max-w-2xl mx-auto">
              <EmergencyOrders />
            </TabsContent>
          )}

          <TabsContent value="items" className="max-w-2xl mx-auto">
            <ItemsManager onNavigateToPayment={handleNavigateToPayment} />
          </TabsContent>

          <TabsContent value="ratings" className="max-w-2xl mx-auto">
            <Card className="rounded-2xl border-[#E5E7EB] shadow-sm">
              <CardHeader className="border-b border-[#E5E7EB] bg-[#165B91]/5 rounded-t-2xl">
                <CardTitle className="flex items-center justify-between text-[#1A1A2E]">
                  <span>{t('dashboard.ratingsCount')} ({ratings.length})</span>
                  {ratings.length > 0 && (
                    <div className="flex items-center gap-2">
                      <RatingStars rating={Math.round(avgRating)} />
                      <span className="text-sm text-[#6B7280]">{avgRating}</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ratings.length === 0 ? (
                  <p className="text-center text-[#6B7280] py-8">{t('dashboard.noRatings')}</p>
                ) : (
                  <div className="space-y-4 mt-4">
                    {ratings.map(r => (
                      <div key={r.id} className="border-b border-[#E5E7EB] last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-[#1A1A2E]">{r.customer_name}</span>
                          <RatingStars rating={r.rating} size={14} />
                        </div>
                        {r.comment && <p className="text-sm text-[#6B7280]">{r.comment}</p>}
                        <p className="text-xs text-[#6B7280] mt-1">
                          {new Date(r.created_at).toLocaleDateString('ar-JO')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="max-w-2xl mx-auto">
            <PaymentManager />
          </TabsContent>

          <TabsContent value="profile" className="max-w-2xl mx-auto">
            <ProfileForm />
          </TabsContent>

          {isAdminPhone && (
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <footer className="border-t border-[#E5E7EB] py-4 mt-8 bg-white">
        <p className="text-center text-sm text-[#6B7280]">
          © {new Date().getFullYear()} {t('index.tabkhatyRights')}
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
