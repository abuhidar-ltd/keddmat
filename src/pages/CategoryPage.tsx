import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Loader2, LayoutGrid, MapPin, Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getCategoryInfo, getSubcategories } from "@/lib/categoryIcons";
import { GOVERNORATES } from "@/lib/governorates";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import logoImage from "@/assets/logo-khadamat.png";

interface ProviderProfile {
  user_id: string;
  display_name: string;
  store_name: string | null;
  page_slug: string;
  avatar_url: string | null;
  country: string | null;
  service_location: string | null;
  subcategories: string[] | null;
  avg_rating?: number;
  rating_count?: number;
}

const PAGE_SIZE = 12;

const normalizeArabicText = (value: string | null) => {
  return (value || '')
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const subcategory = searchParams.get('sub');
  const { t, dir, language } = useLanguage();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);
  const offsetRef = useRef(0);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const requestIdRef = useRef(0);
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const categoryInfo = getCategoryInfo(category || '');
  const CategoryIcon = categoryInfo?.icon || LayoutGrid;

  useEffect(() => {
    offsetRef.current = 0;
    seenIdsRef.current = new Set();
    setProviders([]);
    setHasMore(true);
    fetchProviders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subcategory, selectedGovernorate]);

  useEffect(() => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !fetchingRef.current) {
        fetchProviders(false);
      }
    }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, hasMore, loadingMore, providers.length]);

  const fetchProviders = async (reset = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const myRequestId = ++requestIdRef.current;

    if (reset) setLoading(true);
    else setLoadingMore(true);

    const from = reset ? 0 : offsetRef.current;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('profiles')
      .select('user_id, display_name, store_name, page_slug, avatar_url, country, service_location, subcategories')
      .eq('page_enabled', true)
      .eq('category', category || '')
      .range(from, to);

    if (subcategory) {
      query = query.contains('subcategories', [subcategory]);
    }

    const { data, error } = await query;

    // Stale request guard
    if (myRequestId !== requestIdRef.current) {
      fetchingRef.current = false;
      return;
    }

    if (error) {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
      return;
    }

    if (data) {
      offsetRef.current = from + data.length;
      let filtered = data;
      if (selectedGovernorate) {
        const normalizedGov = normalizeArabicText(selectedGovernorate);
        filtered = data.filter(p => {
          const loc = normalizeArabicText(p.service_location);
          return loc.includes(normalizedGov) || normalizedGov.includes(loc);
        });
      }
      // Dedupe against already-seen ids
      const unique = filtered.filter(p => {
        if (seenIdsRef.current.has(p.user_id)) return false;
        seenIdsRef.current.add(p.user_id);
        return true;
      });

      // Fetch ratings for these providers and attach avg
      const ids = unique.map(p => p.user_id);
      let withRatings: ProviderProfile[] = unique;
      if (ids.length > 0) {
        const { data: ratingsData } = await supabase.from('ratings').select('merchant_id, rating').in('merchant_id', ids);
        const map = new Map<string, { sum: number; count: number }>();
        (ratingsData || []).forEach((r: any) => {
          const cur = map.get(r.merchant_id) || { sum: 0, count: 0 };
          cur.sum += r.rating; cur.count += 1; map.set(r.merchant_id, cur);
        });
        withRatings = unique.map(p => {
          const m = map.get(p.user_id);
          return { ...p, avg_rating: m ? m.sum / m.count : 0, rating_count: m?.count || 0 };
        });
      }

      setHasMore(data.length === PAGE_SIZE);
      setProviders(prev => {
        const merged = reset ? withRatings : (() => {
          const existing = new Set(prev.map(p => p.user_id));
          const safe = withRatings.filter(p => !existing.has(p.user_id));
          return [...prev, ...safe];
        })();
        // Random shuffle so provider order differs every visit
        const shuffled = [...merged];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      });
    }
    setLoading(false);
    setLoadingMore(false);
    fetchingRef.current = false;
  };

  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-[#EFF3F8]" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] shadow-sm">
        <div className="container flex items-center justify-between h-14 px-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#165B91] font-bold text-sm hover:opacity-80 transition-opacity"
          >
            <BackArrow className="h-5 w-5" />
            <span>{t('header.home') || 'الرئيسية'}</span>
          </button>
          <img src={logoImage} alt="خدمات" className="h-8 object-contain" />
          <div className="w-16" />
        </div>
      </header>

      {/* Category Title */}
      <div className="bg-white border-b border-[#E5E7EB] py-6">
        <div className="container px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${categoryInfo?.hex || '#165B91'}18` }}>
              <CategoryIcon className="h-6 w-6" style={{ color: categoryInfo?.hex || '#165B91' }} />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A1A2E]">{subcategory || category}</h1>
          </div>
          <p className="text-[#6B7280] text-sm">
            {subcategory ? `${category} › ${subcategory}` : (isAr ? `جميع مقدمي خدمة ${category}` : `All ${category} providers`)}
          </p>
        </div>
      </div>

      {/* Governorate Filter Chips */}
      <div className="container px-4 py-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => setSelectedGovernorate(null)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all border ${
                !selectedGovernorate
                  ? 'bg-[#165B91] text-white border-[#165B91] shadow-md'
                  : 'bg-white text-[#1A1A2E] border-[#E5E7EB] hover:border-[#165B91]/50'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              {isAr ? 'الكل' : 'All'}
            </button>
            {GOVERNORATES.map((gov) => (
              <button
                key={gov.value}
                onClick={() => setSelectedGovernorate(gov.value)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all border ${
                  selectedGovernorate === gov.value
                    ? 'bg-[#165B91] text-white border-[#165B91] shadow-md'
                    : 'bg-white text-[#1A1A2E] border-[#E5E7EB] hover:border-[#165B91]/50'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                {isAr ? gov.labelAr : gov.labelEn}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <main className="container pb-8 px-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse rounded-2xl">
                <CardContent className="p-6 flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-muted" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20">
            <CategoryIcon className="h-16 w-16 mx-auto mb-4 text-[#165B91]/40" />
            <h3 className="text-xl font-semibold mb-2 text-[#1A1A2E]">{isAr ? 'لا يوجد مقدمي خدمة حالياً' : 'No providers found'}</h3>
            <p className="text-[#6B7280]">{isAr ? 'سيتم إضافة مقدمي خدمة قريباً' : 'Providers will be added soon'}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {providers.map((provider) => (
                <Link key={provider.user_id} to={`/p/${provider.page_slug}`}>
                  <Card className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-2xl bg-white border border-[#E5E7EB]">
                    <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                      <Avatar className="w-16 h-16 ring-2 ring-[#165B91]/30 ring-offset-2">
                        {provider.avatar_url ? (
                          <AvatarImage src={provider.avatar_url} alt={provider.display_name} />
                        ) : null}
                        <AvatarFallback className="bg-[#165B91]/10">
                          <CategoryIcon className="h-8 w-8 text-[#165B91]" />
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold text-sm text-gray-800">{provider.store_name || provider.display_name}</h3>
                      {category && (
                        <p className="text-xs text-gray-500 -mt-1">{subcategory || category}</p>
                      )}
                      {(provider.rating_count || 0) > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-gray-800">{(provider.avg_rating || 0).toFixed(1)}</span>
                          <span className="text-gray-600">({provider.rating_count})</span>
                        </div>
                      )}
                      {provider.service_location && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="h-3 w-3 text-[#165B91]" />
                          <span>{provider.service_location}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {hasMore ? (
              <div ref={sentinelRef} className="flex justify-center py-8">
                {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-[#165B91]" />}
              </div>
            ) : providers.length > 0 && (
              <p className="text-center text-[#6B7280] py-8 text-sm">{isAr ? 'لا يوجد المزيد' : 'No more results'}</p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CategoryPage;
