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

  const handleCall = () => {
    if (profile?.whatsapp_number) {
      supabase.from('call_clicks').insert({ merchant_id: profile.user_id }).then(() => {});
      window.location.href = `tel:+${profile.whatsapp_number.replace(/[^0-9]/g, '')}`;
    }
  };
  const handleWhatsApp = async () => {
    if (profile?.whatsapp_number) {
      const cleanNumber = profile.whatsapp_number.replace(/[^0-9]/g, '');
      supabase.from('whatsapp_clicks').insert({ merchant_id: profile.user_id }).then(() => {});
      // Send automatic WhatsApp message to provider via API
      try {
        await supabase.functions.invoke('send-whatsapp', {
          body: { to: cleanNumber, message: 'مرحبا، أنا عميل من موقع خدمات أرغب بالتواصل معك' },
        });
      } catch (e) { /* silent fail */ }
      const fullPhone = cleanNumber.startsWith('962') ? cleanNumber : `962${cleanNumber.replace(/^0/, '')}`;
      const msg = encodeURIComponent('مرحبا أنا عميل من خدمات');
      window.location.assign(`https://wa.me/${fullPhone}?text=${msg}`);
    }
  };
  const copyPhone = async () => {
    if (profile?.whatsapp_number) {
      await navigator.clipboard.writeText(profile.whatsapp_number);
      setCopied(true); toast.success(dir === 'rtl' ? 'تم نسخ الرقم' : 'Phone copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (notFound) return <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4" dir={dir}><h1 className="text-2xl font-bold mb-2">{t('public.notFound')}</h1><p className="text-muted-foreground text-center">{t('public.notAvailable')}</p></div>;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="bg-card border-b border-border py-2 px-4"><div className="container flex items-center justify-end"><LanguageToggle /></div></div>
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/20 to-accent/20">
        {profile?.cover_url ? <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" />}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-background shadow-xl" /> : <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-card flex items-center justify-center border-4 border-background shadow-xl"><span className="text-4xl">👤</span></div>}
        </div>
      </div>
      <header className="container pt-16 pb-6">
        <div className="text-center">
          {profile?.store_name && <h1 className="text-2xl md:text-3xl font-bold mb-1">{profile.store_name}</h1>}
          <h2 className={`${profile?.store_name ? 'text-lg md:text-xl text-muted-foreground' : 'text-2xl md:text-3xl'} font-bold mb-1`}>{profile?.display_name || t('public.noName')}</h2>
          {profile?.category && (
            <p className="text-base font-semibold text-primary mb-2">
              {profile.category}{profile.subcategories && profile.subcategories.length > 0 ? ` - ${(() => {
                const subId = profile.subcategories![0];
                const subInfo = getSubcategories(profile.category || '').find(s => s.id === subId);
                return subInfo ? subInfo.labelAr : subId;
              })()}` : ''}
            </p>
          )}
          {profile?.bio && <p className="text-muted-foreground max-w-md mx-auto mb-4 leading-relaxed">{profile.bio}</p>}
          {ratingCount > 0 && <div className="flex items-center justify-center gap-2 mb-4"><RatingStars rating={Math.round(avgRating)} size={18} /><span className="font-bold">{avgRating}</span><span className="text-sm text-muted-foreground">({ratingCount})</span></div>}
          {profile?.whatsapp_number && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
                <Phone className="h-4 w-4 text-primary" /><span className="font-medium" dir="ltr">{profile.whatsapp_number}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyPhone}>{copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}</Button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            {profile?.service_location && <div className="flex items-center gap-3 bg-primary/15 text-primary px-5 py-3 rounded-xl border border-primary/20"><MapPin className="h-5 w-5" /><span className="text-base font-bold">{profile.service_location}</span></div>}
            {profile?.working_hours && <div className="flex items-center gap-3 bg-accent/15 text-accent-foreground px-5 py-3 rounded-xl border border-accent/20"><Clock className="h-5 w-5" /><span className="text-base font-bold">{profile.working_hours}</span></div>}
          </div>
        </div>
      </header>
      {profile?.whatsapp_number && (
        <div className="container pb-8">
          <div className="flex items-center justify-center gap-3 mb-4"><div className="h-px w-12 bg-border" /><span className="text-sm font-semibold text-muted-foreground">{dir === 'rtl' ? 'تواصل مع مقدم الخدمة' : 'Contact the Provider'}</span><div className="h-px w-12 bg-border" /></div>
          <div className="flex gap-4 justify-center max-w-md mx-auto">
            <Button onClick={handleCall} size="lg" className="flex-1 gap-2 shadow-lg shadow-primary/20"><Phone className="h-4 w-4" />{t('public.call')}</Button>
            <Button onClick={handleWhatsApp} size="lg" className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"><MessageCircle className="h-4 w-4" />{t('public.whatsapp')}</Button>
          </div>
        </div>
      )}
      {profile && <RatingSection merchantId={profile.user_id} dir={dir} />}
      <section className="container pb-12">
        <h2 className="text-lg font-bold mb-4 text-center">{dir === 'rtl' ? 'نبذه عن أعمالنا' : 'About Our Work'}</h2>
        {items.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">{t('public.noItems')}</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {items.map((item) => {
              const galleryUrls = item.gallery_images?.map(img => img.image_url) || [];
              const hasGallery = galleryUrls.length > 0 || item.image_url;
              return (
                <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  {hasGallery ? <ImageGallery mainImage={item.image_url} images={galleryUrls} alt={item.title} /> : <div className="aspect-square bg-muted flex items-center justify-center"><Package className="h-12 w-12 text-muted-foreground/30" /></div>}
                  <CardContent className="p-3"><h3 className="font-semibold text-sm line-clamp-1 mb-1">{item.title}</h3>{item.description && <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{item.description}</p>}{item.price > 0 && <p className="text-sm font-bold text-primary mt-2">{item.price} {dir === 'rtl' ? 'د.أ' : 'JOD'}</p>}</CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {hasMore ? <div ref={sentinelRef} className="flex justify-center py-8">{loadingMore && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}</div> : items.length > 0 && <p className="text-center text-muted-foreground py-8 text-sm">{dir === 'rtl' ? 'لا يوجد المزيد' : 'No more items'}</p>}
      </section>
      <footer className="border-t border-border py-6 bg-card"><p className="text-center text-sm text-muted-foreground">{t('public.salesDisclaimer')}</p></footer>
    </div>
  );
};

export default PublicPage;