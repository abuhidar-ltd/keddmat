import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import Header from "@/components/Header";
import CategoryFilter from "@/components/CategoryFilter";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, LayoutGrid, MapPin } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getCategoryInfo } from "@/lib/categoryIcons";

interface ProviderProfile {
  user_id: string;
  display_name: string;
  page_slug: string;
  avatar_url: string | null;
  country: string | null;
  service_location: string | null;
}

const PAGE_SIZE = 12;

const Browse = () => {
  const { t, dir } = useLanguage();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || "all");
  const selectedCountry = localStorage.getItem('user_selected_country') || 'all';
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { fetchProviders(true); }, []);

  useEffect(() => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) fetchProviders(false);
    }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, hasMore, loadingMore, providers.length]);

  const fetchProviders = async (reset = false) => {
    if (reset) { setLoading(true); setProviders([]); }
    else { if (loadingMore) return; setLoadingMore(true); }
    const from = reset ? 0 : providers.length;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, display_name, page_slug, avatar_url, country, service_location')
      .eq('page_enabled', true)
      .range(from, to);

    if (error) { setLoading(false); setLoadingMore(false); return; }
    if (data) {
      setHasMore(data.length === PAGE_SIZE);
      setProviders(prev => reset ? data : [...prev, ...data]);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const filteredProviders = providers.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || p.display_name.toLowerCase().includes(query) || (p.service_location && p.service_location.toLowerCase().includes(query));
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || p.display_name === selectedCategory;
    const matchesCountry = !selectedCountry || selectedCountry === 'all' || p.country === selectedCountry;
    return matchesSearch && matchesCategory && matchesCountry;
  });

  return (
    <div className="min-h-screen bg-background bokeh-bg" dir={dir}>
      <Header />
      <div className="sticky top-16 z-40 bg-card/80 backdrop-blur-xl border-b border-border py-4">
        <div className="container space-y-3">
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
            <Input placeholder={t('index.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`h-12 text-base ${dir === 'rtl' ? 'pr-10' : 'pl-10'}`} />
          </div>
          <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </div>
      </div>

      <main className="container py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
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
            <LayoutGrid className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('browse.noDishes')}</h3>
            <p className="text-muted-foreground">{t('browse.tryChangingFilters')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProviders.map((provider) => {
                const catInfo = getCategoryInfo(provider.display_name);
                const CatIcon = catInfo?.icon || LayoutGrid;
                return (
                  <Link key={provider.user_id} to={`/p/${provider.page_slug}`}>
                    <Card className="overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                      <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                        <Avatar className="w-16 h-16 border-2 border-primary/20">
                          {provider.avatar_url ? <AvatarImage src={provider.avatar_url} alt={provider.display_name} /> : null}
                          <AvatarFallback className="bg-primary/10">
                            <CatIcon className={`h-8 w-8 ${catInfo?.color || 'text-primary'}`} />
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-sm text-foreground">{provider.display_name}</h3>
                        {provider.service_location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{provider.service_location}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
            {hasMore ? (
              <div ref={sentinelRef} className="flex justify-center py-8">
                {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
              </div>
            ) : providers.length > 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">{t('browse.noMore') || 'لا يوجد المزيد'}</p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Browse;
