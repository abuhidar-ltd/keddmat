import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Package, Loader2, Store, Truck, Phone } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import type { Profile, Product } from '@/types/keddmat';
import { isPublicStoreVisible } from '@/lib/subscription';

const normalizePhone = (phone: string) => {
  const n = phone.replace(/[^0-9]/g, '');
  return n.startsWith('962') ? n : `962${n.replace(/^0/, '')}`;
};

const StorePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) loadStore();
  }, [slug]);

  const loadStore = async () => {
    const { data } = await supabase.from('public_profiles')
      .select('user_id, store_name, store_description, avatar_url, cover_url, page_slug, whatsapp_number, is_active, subscription_expires_at')
      .eq('page_slug', slug)
      .maybeSingle();

    if (!data || !isPublicStoreVisible({
      is_active: !!data.is_active,
      subscription_expires_at: (data as Profile).subscription_expires_at ?? null,
    })) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProfile(data as Profile);

    // Fire-and-forget analytics
    supabase.from('store_analytics').insert({ store_id: data.user_id, event_type: 'link_click' }).then(() => {});

    const { data: prods } = await supabase.from('products')
      .select('*')
      .eq('user_id', data.user_id)
      .order('created_at', { ascending: false });

    setProducts((prods as Product[]) || []);
    setLoading(false);
  };

  const trackWaClick = (productId?: string) => {
    if (!profile) return;
    supabase.from('store_analytics').insert({
      store_id: profile.user_id,
      event_type: 'whatsapp_click',
      product_id: productId || null,
    }).then(() => {});
  };

  const handleGeneralWa = () => {
    if (!profile?.whatsapp_number) return;
    trackWaClick();
    const phone = normalizePhone(profile.whatsapp_number);
    window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
  };

  const handleProductWa = (product: Product) => {
    if (!profile?.whatsapp_number) return;
    trackWaClick(product.id);
    const phone = normalizePhone(profile.whatsapp_number);
    const msg = encodeURIComponent(`مرحباً، أنا مهتم بـ ${product.title} بسعر ${product.price} JOD`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-9 w-9 animate-spin text-brand-purple" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center" dir="rtl">
        <Store className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">هذا المتجر غير متاح حالياً</h1>
        <p className="text-gray-500 mb-6">المتجر إما غير موجود أو لم يتم تفعيله بعد</p>
        <Link to="/">
          <Button variant="outline" className="rounded-xl">العودة للرئيسية</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface" dir="rtl">
      {/* Cover */}
      <div className="relative h-48 md:h-64">
        {profile?.cover_url
          ? <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-brand-cyan to-brand-purple" />}

        {/* Avatar */}
        <div className="absolute -bottom-12 left-1/2 z-20 -translate-x-1/2">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl ring-2 ring-brand-purple/70">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={profile.store_name || ''} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-brand-purple flex items-center justify-center"><Store className="h-10 w-10 text-white" /></div>}
          </div>
        </div>
      </div>

      {/* Store info */}
      <div className="container mx-auto px-4 pt-16 pb-4">
        <div className="mb-4 text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{profile?.store_name || 'متجر'}</h1>
          {profile?.store_description && (
            <p className="text-gray-600 mt-1 leading-relaxed">{profile.store_description}</p>
          )}
        </div>

        {/* Contact buttons */}
        {profile?.whatsapp_number && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <Button
              onClick={handleGeneralWa}
              className="gap-2 font-bold rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-md"
            >
              <MessageCircle className="h-5 w-5" />
              تواصل عبر واتساب
            </Button>
            <Button
              asChild
              variant="outline"
              className="gap-2 font-bold rounded-xl border-brand-purple text-brand-purple hover:bg-brand-purple/5 shadow-md"
            >
              <a href={`tel:+${normalizePhone(profile.whatsapp_number)}`}>
                <Phone className="h-5 w-5" />
                اتصال
              </a>
            </Button>
          </div>
        )}

        {/* Products */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">المنتجات ({products.length})</h2>

        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>لا توجد منتجات حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            {products.map(product => (
              <Card key={product.id} className="min-w-0 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-0 bg-white">
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  {product.image_url
                    ? <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package className="h-10 w-10 text-gray-300" /></div>}
                </div>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-gray-900 leading-tight">{product.title}</h3>
                  {product.description && (
                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-brand-purple">{product.price} JOD</span>
                    {product.delivery_available && (
                      <Badge className="bg-violet-50 text-brand-purple border-0 gap-1 text-xs">
                        <Truck className="h-3 w-3" />
                        توصيل متاح {product.delivery_price ? `${product.delivery_price} JOD` : ''}
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => handleProductWa(product)}
                    className="w-full gap-2 font-bold rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white"
                    size="sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    اطلب عبر واتساب
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-brand-purple/10 py-4 bg-white">
        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-2 flex-wrap">
          <span>مدعوم بواسطة</span>
          <Link to="/" className="inline-flex items-center hover:opacity-90 transition-opacity">
            <BrandLogo height={22} />
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default StorePage;
