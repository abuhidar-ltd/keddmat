import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { getSubcategories } from '@/lib/categoryIcons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, MessageCircle, Loader2, Package, Copy, Check, MapPin, Clock } from 'lucide-react';
import ImageGallery from '@/components/ui/image-gallery';
import LanguageToggle from '@/components/LanguageToggle';
import RatingStars from '@/components/RatingStars';
import RatingSection from '@/components/RatingSection';
import { toast } from 'sonner';

interface Profile {
  display_name: string | null; bio: string | null; whatsapp_number: string | null;
  has_delivery: boolean; avatar_url: string | null; cover_url: string | null;
  user_id: string; service_location: string | null; working_hours: string | null;
  store_name: string | null; category?: string | null; subcategories?: string[] | null;
}

interface ItemImage { id: string; image_url: string; sort_order: number; }

interface Item {
  id: string; title: string; description: string | null; price: number;
  image_url: string | null; currency: string | null; gallery_images?: ItemImage[];
}

const ITEMS_PAGE_SIZE = 3;

const PublicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { t, dir } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const itemsOffsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<Profile | null>(null);

  const fetchItemsBatch = useCallback(async (userId: string, offset: number) => {
    const { data: itemsData } = await supabase.from('items').select('id, title, description, price, image_url, currency')
      .eq('user_id', userId).eq('is_active', true).order('sort_order', { ascending: true }).range(offset, offset + ITEMS_PAGE_SIZE - 1);
    if (!itemsData || itemsData.length === 0) { setHasMore(false); return []; }
    if (itemsData.length < ITEMS_PAGE_SIZE) setHasMore(false);
    const itemIds = itemsData.map(item => item.id);
    const { data: galleryData } = await supabase.from('item_images').select('id, item_id, image_url, sort_order').in('item_id', itemIds).order('sort_order', { ascending: true });
    return itemsData.map(item => ({ ...item, gallery_images: galleryData?.filter(img => img.item_id === item.id) || [] }));
  }, []);

  const loadMoreItems = useCallback(async () => {
    if (loadingMore || !hasMore || !profileRef.current) return;
    setLoadingMore(true);
    const batch = await fetchItemsBatch(profileRef.current.user_id, itemsOffsetRef.current);
    if (batch.length > 0) { setItems(prev => [...prev, ...batch]); itemsOffsetRef.current += batch.length; }
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchItemsBatch]);

  useEffect(() => {
    if (!sentinelRef.current || loading) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadMoreItems(); }, { rootMargin: '200px' });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMoreItems, loading]);

  useEffect(() => { if (slug) fetchPageData(); }, [slug]);

  useEffect(() => {
    if (location.state?.orderConfirmed) {
      toast.success(dir === 'rtl' ? 'تواصل مع مقدم الخدمة لإكمال طلبك' : 'Contact the provider to complete your order', { duration: 6000 });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchPageData = async () => {
    const { data: profileData, error } = await supabase.from('public_profiles')
      .select('display_name, bio, whatsapp_number, has_delivery, avatar_url, cover_url, user_id, service_location, working_hours, store_name')
      .eq('page_slug', slug).maybeSingle();
    if (error || !profileData) { setNotFound(true); setLoading(false); return; }
    const prof = profileData as Profile;
    // Fetch category & subcategories from profiles table
    const { data: extraData } = await supabase.from('profiles').select('category, subcategories').eq('user_id', prof.user_id).maybeSingle();
    if (extraData) { prof.category = extraData.category; prof.subcategories = extraData.subcategories; }
    setProfile(prof); profileRef.current = prof;
    const firstBatch = await fetchItemsBatch(prof.user_id, 0);
    setItems(firstBatch); itemsOffsetRef.current = firstBatch.length;
    const { data: ratingsData } = await supabase.from('ratings').select('rating').eq('merchant_id', prof.user_id);
    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce((sum: number, r: any) => sum + r.rating, 0) / ratingsData.length;
      setAvgRating(Math.round(avg * 10) / 10); setRatingCount(ratingsData.length);
    }
    setLoading(false);
  };

  const trackPublicClick = async (table: 'whatsapp_clicks' | 'call_clicks', merchantId: string) => {
    const SUPABASE_URL = 'https://fooqrkdniswrzwgcytne.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvb3Fya2RuaXN3cnp3Z2N5dG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mzg5MTMsImV4cCI6MjA4ODMxNDkxM30.px0ExibFbOMoNBw-emojn6k3UbrHsZSda4oFTWPpOis';
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ merchant_id: merchantId }),
        keepalive: true,
      });
    } catch (e) {
      console.error(`${table} insert failed:`, e);
    }
  };

  const handleCall = async () => {
    if (profile?.whatsapp_number) {
      const cleanNumber = profile.whatsapp_number.replace(/[^0-9]/g, '');
      const fullPhone = cleanNumber.startsWith('962') ? cleanNumber : `962${cleanNumber.replace(/^0/, '')}`;
      await trackPublicClick('call_clicks', profile.user_id);
      setTimeout(() => { window.location.href = `tel:+${fullPhone}`; }, 300);
    }
  };
  const handleWhatsApp = async () => {
    if (profile?.whatsapp_number) {
      const cleanNumber = profile.whatsapp_number.replace(/[^0-9]/g, '');
      const fullPhone = cleanNumber.startsWith('962') ? cleanNumber : `962${cleanNumber.replace(/^0/, '')}`;
      await trackPublicClick('whatsapp_clicks', profile.user_id);
      try {
        void supabase.functions.invoke('send-whatsapp', {
          body: { to: cleanNumber, message: 'مرحبا، أنا عميل من موقع خدمات أرغب بالتواصل معك' },
        });
      } catch (e) { /* silent */ }
      const msg = encodeURIComponent('مرحبا أنا عميل من خدمات');
      window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank', 'noopener,noreferrer');
    }
  };
  const copyPhone = async () => {
    if (profile?.whatsapp_number) {
      await navigator.clipboard.writeText(profile.whatsapp_number);
      setCopied(true); toast.success(dir === 'rtl' ? 'تم نسخ الرقم' : 'Phone copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-[#165B91]" /></div>;
  if (notFound) return <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4" dir={dir}><h1 className="text-2xl font-bold mb-2 text-[#1A1A2E]">{t('public.notFound')}</h1><p className="text-[#6B7280] text-center">{t('public.notAvailable')}</p></div>;

  return (
    <div className="min-h-screen bg-[#EFF3F8]" dir={dir}>
      {/* Language toggle bar */}
      <div className="bg-white border-b border-[#E5E7EB] py-2 px-4">
        <div className="container flex items-center justify-end"><LanguageToggle /></div>
      </div>

      {/* Cover Banner */}
      <div className="relative h-48 md:h-64">
        <div className="absolute inset-0 overflow-hidden">
          {profile?.cover_url
            ? <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
            : <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #105A8E, #165B91)" }} />
          }
        </div>
        {/* Avatar */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-20">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-white shadow-xl ring-4 ring-[#165B91]/30" />
            : <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white flex items-center justify-center border-4 border-white shadow-xl ring-4 ring-[#165B91]/30"><span className="text-4xl">👤</span></div>
          }
        </div>
      </div>

      {/* Profile Info */}
      <header className="container pt-16 pb-6">
        <div className="text-center">
          {profile?.store_name && <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A1A2E] mb-1">{profile.store_name}</h1>}
          <h2 className={`${profile?.store_name ? 'text-lg md:text-xl text-[#6B7280]' : 'text-2xl md:text-3xl'} font-bold mb-1 text-[#1A1A2E]`}>
            {profile?.display_name || t('public.noName')}
          </h2>
          {profile?.category && (
            <p className="text-base font-semibold text-[#165B91] mb-2">
              {profile.category}{profile.subcategories && profile.subcategories.length > 0 ? ` - ${(() => {
                const subId = profile.subcategories![0];
                const subInfo = getSubcategories(profile.category || '').find(s => s.id === subId);
                return subInfo ? subInfo.labelAr : subId;
              })()}` : ''}
            </p>
          )}
          {profile?.bio && <p className="text-[#6B7280] max-w-md mx-auto mb-4 leading-relaxed">{profile.bio}</p>}
          {ratingCount > 0 && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <RatingStars rating={Math.round(avgRating)} size={18} />
              <span className="font-bold text-[#1A1A2E]">{avgRating}</span>
              <span className="text-sm text-[#6B7280]">({ratingCount})</span>
            </div>
          )}
          {profile?.whatsapp_number && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-2 bg-[#165B91]/8 border border-[#165B91]/20 px-4 py-2 rounded-xl">
                <Phone className="h-4 w-4 text-[#165B91]" />
                <span className="font-medium text-[#1A1A2E]" dir="ltr">{profile.whatsapp_number}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#165B91]/10" onClick={copyPhone}>
                  {copied ? <Check className="h-4 w-4 text-[#165B91]" /> : <Copy className="h-4 w-4 text-[#6B7280]" />}
                </Button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
            {profile?.service_location && (
              <div className="flex items-center gap-2 bg-[#165B91]/10 text-[#165B91] px-4 py-2 rounded-xl border border-[#165B91]/20">
                <MapPin className="h-4 w-4" /><span className="text-sm font-bold">{profile.service_location}</span>
              </div>
            )}
            {profile?.working_hours && (
              <div className="flex items-center gap-2 bg-[#165B91]/10 text-[#105A8E] px-4 py-2 rounded-xl border border-[#165B91]/20">
                <Clock className="h-4 w-4" /><span className="text-sm font-bold">{profile.working_hours}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contact Buttons */}
      {profile?.whatsapp_number && (
        <div className="container pb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px flex-1 max-w-16 bg-[#E5E7EB]" />
            <span className="text-sm font-semibold text-[#6B7280]">{dir === 'rtl' ? 'تواصل مع مقدم الخدمة' : 'Contact the Provider'}</span>
            <div className="h-px flex-1 max-w-16 bg-[#E5E7EB]" />
          </div>
          <div className="flex gap-4 justify-center max-w-md mx-auto">
            <Button onClick={handleCall} size="lg" className="flex-1 gap-2 bg-[#165B91] hover:bg-[#124a77] text-white rounded-xl shadow-md">
              <Phone className="h-4 w-4" />{t('public.call')}
            </Button>
            <Button onClick={handleWhatsApp} size="lg" className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl shadow-md">
              <MessageCircle className="h-4 w-4" />{t('public.whatsapp')}
            </Button>
          </div>
        </div>
      )}

      {profile && <RatingSection merchantId={profile.user_id} dir={dir} />}

      {/* Items / Portfolio */}
      <section className="container pb-12">
        <h2 className="text-lg font-extrabold mb-4 text-center text-[#1A1A2E]">
          {dir === 'rtl' ? 'نبذه عن أعمالنا' : 'About Our Work'}
        </h2>
        {items.length === 0 ? (
          <Card className="rounded-2xl border-[#E5E7EB]">
            <CardContent className="p-8 text-center"><p className="text-[#6B7280]">{t('public.noItems')}</p></CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {items.map((item) => {
              const galleryUrls = item.gallery_images?.map(img => img.image_url) || [];
              const hasGallery = galleryUrls.length > 0 || item.image_url;
              return (
                <Card key={item.id} className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl border-[#E5E7EB] bg-white">
                  {hasGallery
                    ? <ImageGallery mainImage={item.image_url} images={galleryUrls} alt={item.title} />
                    : <div className="aspect-square bg-[#EFF3F8] flex items-center justify-center"><Package className="h-12 w-12 text-[#165B91]/20" /></div>
                  }
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-1 mb-1 text-[#1A1A2E]">{item.title}</h3>
                    {item.description && <p className="text-xs text-[#6B7280] line-clamp-3 leading-relaxed">{item.description}</p>}
                    {item.price > 0 && <p className="text-sm font-bold text-[#165B91] mt-2">{item.price} {dir === 'rtl' ? 'د.أ' : 'JOD'}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {hasMore
          ? <div ref={sentinelRef} className="flex justify-center py-8">{loadingMore && <Loader2 className="h-6 w-6 animate-spin text-[#165B91]" />}</div>
          : items.length > 0 && <p className="text-center text-[#6B7280] py-8 text-sm">{dir === 'rtl' ? 'لا يوجد المزيد' : 'No more items'}</p>
        }
      </section>

      <footer className="border-t border-[#E5E7EB] py-6 bg-white">
        <p className="text-center text-sm text-[#6B7280]">{t('public.salesDisclaimer')}</p>
      </footer>
    </div>
  );
};

export default PublicPage;