import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import Header from "@/components/Header";
import CategoryFilter from "@/components/CategoryFilter";
import EmergencyRequestModal from "@/components/EmergencyRequestModal";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, Loader2, LayoutGrid, MapPin, AlertTriangle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getCategoryInfo } from "@/lib/categoryIcons";
import { GOVERNORATES } from "@/lib/governorates";

interface ProviderProfile {
  user_id: string;
  display_name: string;
  store_name: string | null;
  page_slug: string;
  avatar_url: string | null;
  country: string | null;
  service_location: string | null;
  category: string | null;
}

const PAGE_SIZE = 12;

const Browse = () => {
  const { t, dir, language } = useLanguage();
  const isAr = language === 'ar';
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || "all");
  const [selectedGovernorate, setSelectedGovernorate] = useState<string | null>(null);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const fetchingRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    offsetRef.current = 0;
    setProviders([]);
    setHasMore(true);
    fetchProviders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedGovernorate]);

  useEffect(() => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !fetchingRef.current) fetchProviders(false);
    }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, hasMore, loadingMore, providers.length]);

  const fetchProviders = async (reset = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const myRequestId = ++requestIdRef.current;

    if (reset) { setLoading(true); setProviders([]); }
    else { setLoadingMore(true); }

    const from = reset ? 0 : offsetRef.current;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('profiles')
      .select('user_id, display_name, store_name, page_slug, avatar_url, country, service_location, category')
      .eq('page_enabled', true);

    if (selectedCategory && selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    if (selectedGovernorate) {
      query = query.ilike('service_location', `%${selectedGovernorate}%`);
    }

    query = query.range(from, to);

    const { data, error } = await query;

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
      setHasMore(data.length === PAGE_SIZE);
      setProviders(prev => reset ? data : [...prev, ...data]);
    }
    setLoading(false);
    setLoadingMore(false);
    fetchingRef.current = false;
  };

  const filteredProviders = providers.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || p.display_name.toLowerCase().includes(query) || (p.store_name && p.store_name.toLowerCase().includes(query)) || (p.service_location && p.service_location.toLowerCase().includes(query));
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F7FAF8]" dir={dir}>
      <Header />

      {/* Section header */}
      <div className="bg-white border-b border-[#E5E7EB] py-6">
        <div className="container px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D7D46] mb-1">
            {dir === 'rtl' ? 'تصفح مقدمي الخدمات' : 'Browse Service Providers'}
          </h1>
          <p className="text-[#6B7280] text-sm">
            {dir === 'rtl' ? 'جد الحرفي المناسب في منطقتك' : 'Find the right craftsman in your area'}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E5E7EB] py-4 shadow-sm">
        <div className="container px-4 space-y-3">
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-[#2D7D46] ${dir === 'rtl' ? 'right-4' : 'left-4'}`} />
            <Input
              placeholder={t('index.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-12 text-base rounded-full border-[#E5E7EB] focus:border-[#2D7D46] focus:ring-[#2D7D46]/20 ${dir === 'rtl' ? 'pr-12' : 'pl-12'}`}
            />
          </div>
          <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setSelectedGovernorate(null)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all border ${
                  !selectedGovernorate
                    ? 'bg-[#2D7D46] text-white border-[#2D7D46] shadow-md'
                    : 'bg-white text-[#1A1A2E] border-[#E5E7EB] hover:border-[#2D7D46]/50'
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
                      ? 'bg-[#2D7D46] text-white border-[#2D7D46] shadow-md'
                      : 'bg-white text-[#1A1A2E] border-[#E5E7EB] hover:border-[#2D7D46]/50'
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
      </div>

      {/* Emergency Banner */}
      <section className="py-5 bg-gradient-to-l from-orange-500 to-red-500">
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <AlertTriangle className="h-8 w-8 animate-pulse shrink-0" />
              <div className="text-right">
                <p className="font-extrabold text-lg leading-none">
                  {isAr ? 'طوارئ الصيانة' : 'Emergency Maintenance'}
                </p>
                <p className="text-orange-100 text-sm mt-0.5">
                  {isAr ? 'احصل على مساعدة فورية 24/7' : 'Get immediate help 24/7'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEmergencyOpen(true)}
              className="bg-white text-red-600 font-extrabold px-6 py-2.5 rounded-full hover:bg-orange-50 transition-colors shadow-lg"
            >
              {isAr ? 'اضغط لطلب صيانة طارئة' : 'Request Emergency Maintenance'}
            </button>
          </div>
        </div>
      </section>

      <main className="container py-8 px-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse rounded-2xl">
                <CardContent className="p-6 flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-muted" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-20">
            <LayoutGrid className="h-16 w-16 mx-auto text-[#2D7D46]/40 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-[#1A1A2E]">{t('browse.noDishes')}</h3>
            <p className="text-gray-700">{t('browse.tryChangingFilters')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProviders.map((provider) => {
                const catInfo = getCategoryInfo(provider.category || provider.display_name);
                const CatIcon = catInfo?.icon || LayoutGrid;
                return (
                  <Link key={provider.user_id} to={`/p/${provider.page_slug}`}>
                    <Card className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-2xl bg-white border border-[#E5E7EB]">
                      <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                        <Avatar className="w-16 h-16 ring-2 ring-[#2D7D46]/30 ring-offset-2">
                          {provider.avatar_url ? <AvatarImage src={provider.avatar_url} alt={provider.display_name} /> : null}
                          <AvatarFallback className="bg-[#2D7D46]/10">
                            <CatIcon className="h-8 w-8 text-[#2D7D46]" />
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-sm text-gray-800">{provider.store_name || provider.display_name}</h3>
                        {provider.category && (
                          <p className="text-xs text-gray-500 -mt-1">{provider.category}</p>
                        )}
                        {provider.service_location && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="h-3 w-3 text-[#2D7D46]" />
                            <span>{provider.service_location}</span>
                          </div>
                        )}
                        <span className="text-xs font-semibold text-white bg-[#2D7D46] px-3 py-0.5 rounded-full">
                          {dir === 'rtl' ? 'تواصل' : 'Contact'}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
            {hasMore ? (
              <div ref={sentinelRef} className="flex justify-center py-8">
                {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-[#2D7D46]" />}
              </div>
            ) : providers.length > 0 && (
              <p className="text-center text-gray-700 py-8 text-sm">{t('browse.noMore') || 'لا يوجد المزيد'}</p>
            )}
          </>
        )}
      </main>

      <EmergencyRequestModal open={emergencyOpen} onOpenChange={setEmergencyOpen} />
    </div>
  );
};

export default Browse;
