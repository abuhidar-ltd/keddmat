import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Package, Loader2, Store, Truck, Phone, Star, X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import type { Profile, Product, Review } from '@/types/keddmat';

const normalizePhone = (phone: string) => {
  const n = phone.replace(/[^0-9]/g, '');
  return n.startsWith('962') ? n : `962${n.replace(/^0/, '')}`;
};

const StarRow = ({ rating, interactive, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star
        key={n}
        className={`h-4 w-4 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:text-amber-400 transition-colors' : ''}`}
        onClick={() => interactive && onRate?.(n)}
      />
    ))}
  </div>
);

const StorePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, dir, language, setLanguage } = useLanguage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev.map(i => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
          .filter(i => i.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
  const cartCount = cart.reduce((sum, { quantity }) => sum + quantity, 0);
  const hasDelivery = cart.some(({ product }) => product.delivery_available);

  const buildWhatsAppMessage = () => {
    if (!profile?.whatsapp_number) return;
    let message = 'مرحباً، أريد طلب المنتجات التالية:\n\n';
    cart.forEach(({ product, quantity }) => {
      message += `• ${product.title} × ${quantity} = ${(product.price * quantity).toFixed(3)} د.أ\n`;
    });
    message += `\nالمجموع: ${cartTotal.toFixed(3)} د.أ`;
    trackWaClick();
    window.open(`https://wa.me/${normalizePhone(profile.whatsapp_number)}?text=${encodeURIComponent(message)}`, '_blank');
  };

  useEffect(() => {
    if (slug) loadStore();
  }, [slug]);

  useEffect(() => {
    if (!profile) return;
    const prevTitle = document.title;
    document.title = `${profile.store_name} - متجر على خدمات`;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', profile.store_name || '');
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', profile.store_description || '');
    return () => { document.title = prevTitle; };
  }, [profile]);

  const loadStore = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, store_name, store_description, avatar_url, cover_url, page_slug, whatsapp_number, is_active')
      .eq('page_slug', slug)
      .maybeSingle();

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setIsActive(!!data.is_active);
    setProfile(data as Profile);

    if (!data.is_active) {
      setLoading(false);
      return;
    }

    supabase.from('store_analytics').insert({ store_id: data.user_id, event_type: 'link_click' }).then(() => {});

    const [prodsRes, reviewsRes] = await Promise.all([
      supabase.from('products').select('*').eq('user_id', data.user_id).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').eq('store_id', data.user_id).order('created_at', { ascending: false }),
    ]);

    setProducts((prodsRes.data as Product[]) || []);
    setReviews((reviewsRes.data as Review[]) || []);
    setLoading(false);
  };

  const loadReviews = async () => {
    if (!profile) return;
    const { data } = await supabase.from('reviews').select('*')
      .eq('store_id', profile.user_id).order('created_at', { ascending: false });
    setReviews((data as Review[]) || []);
  };

  const submitReview = async () => {
    if (!profile || !reviewForm.name.trim()) return;
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      store_id: profile.user_id,
      reviewer_name: reviewForm.name.trim(),
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim() || null,
    });
    setSubmittingReview(false);
    if (error) {
      toast({ title: t('reviews.errorTitle'), variant: 'destructive' });
      return;
    }
    toast({ title: t('reviews.successTitle'), description: t('reviews.successDesc') });
    setReviewForm({ name: '', rating: 5, comment: '' });
    loadReviews();
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
    const msg = encodeURIComponent(language === 'ar'
      ? `مرحباً، أنا مهتم بـ ${product.title} بسعر ${product.price} JOD`
      : `Hello, I'm interested in ${product.title} priced at ${product.price} JOD`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-9 w-9 animate-spin text-brand-purple" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center" dir={dir}>
        <Store className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">هذا المتجر غير موجود</h1>
        <p className="text-gray-500 mb-6">{t('store.storeUnavailableDesc')}</p>
        <Link to="/"><Button variant="outline" className="rounded-xl">{t('store.backHome')}</Button></Link>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center" dir={dir}>
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{profile?.store_name || 'متجر'}</h1>
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-6 py-5">
            <p className="text-amber-800 font-semibold text-base">هذا المتجر غير منشور بعد</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface" dir={dir}>
      {/* Cover */}
      <div className="relative aspect-[4/3] w-full">
        {profile?.cover_url
          ? <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-brand-purple to-brand-cyan" />}

        {/* Avatar */}
        <div className="absolute -bottom-12 left-1/2 z-20 -translate-x-1/2">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
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
          {avgRating !== null && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({reviews.length} {t('reviews.reviewCount')})</span>
            </div>
          )}
        </div>

        {/* Contact buttons */}
        {profile?.whatsapp_number && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <Button
              onClick={handleGeneralWa}
              className="w-full sm:w-auto gap-2 font-bold rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-md"
            >
              <MessageCircle className="h-5 w-5" />
              {t('store.contactWhatsapp')}
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto gap-2 font-bold rounded-xl border-brand-purple text-brand-purple hover:bg-brand-purple/5 shadow-md"
            >
              <a href={`tel:+${normalizePhone(profile.whatsapp_number)}`}>
                <Phone className="h-5 w-5" />
                {t('store.call')}
              </a>
            </Button>
          </div>
        )}

        {/* Products */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {t('store.products')} ({products.length})
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>{t('store.noProducts')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-6">
            {products.map(product => (
              <Card key={product.id} className="min-w-0 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-0 bg-white">
                <div className="w-full aspect-[3/4] max-h-44 md:max-h-none overflow-hidden flex items-center justify-center bg-gray-100">
                  {product.image_url
                    ? <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover object-center cursor-zoom-in"
                        onClick={() => setLightboxUrl(product.image_url)}
                      />
                    : <Package className="h-8 w-8 md:h-10 md:w-10 text-gray-300" />}
                </div>
                <CardContent className="p-2 md:p-4 space-y-2 md:space-y-3">
                  <h3 className="font-bold text-gray-900 leading-tight text-sm md:text-base">{product.title}</h3>
                  {product.description && (
                    <p className="text-xs md:text-sm text-gray-700 line-clamp-2 leading-relaxed">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm md:text-lg font-extrabold text-brand-purple">{product.price} JOD</span>
                    {product.delivery_available && (
                      <Badge className="bg-violet-50 text-brand-purple border-0 gap-1 text-xs hidden sm:flex">
                        <Truck className="h-3 w-3" />
                        {t('store.deliveryAvailable')} {product.delivery_price ? `${product.delivery_price} JOD` : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Button
                      onClick={() => addToCart(product)}
                      className="w-full gap-1 md:gap-2 font-bold rounded-xl text-white text-xs md:text-sm py-1 md:py-2 h-auto primary-gradient"
                    >
                      <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
                      {cart.find(i => i.product.id === product.id)
                        ? `في السلة (${cart.find(i => i.product.id === product.id)?.quantity})`
                        : 'أضف للسلة'}
                    </Button>
                    <Button
                      onClick={() => handleProductWa(product)}
                      variant="outline"
                      className="w-full gap-1 md:gap-2 font-bold rounded-xl text-xs md:text-sm py-1 md:py-2 h-auto border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
                    >
                      <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
                      واتساب
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reviews */}
        <div className="mt-4 pb-12 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">{t('reviews.title')}</h2>

          {reviews.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">{t('reviews.noReviews')}</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <Card key={r.id} className="border-0 shadow-sm rounded-2xl bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900">{r.reviewer_name}</p>
                      <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB')}</p>
                    </div>
                    <StarRow rating={r.rating} />
                    {r.comment && <p className="mt-2 text-sm text-gray-700 leading-relaxed">{r.comment}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Review form */}
          <Card className="border border-brand-purple/15 rounded-2xl bg-white">
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-brand-purple">{t('reviews.addReview')}</p>
              <Input
                placeholder={t('reviews.yourName')}
                value={reviewForm.name}
                onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-xl h-10"
              />
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{t('reviews.yourRating')}</p>
                <StarRow rating={reviewForm.rating} interactive onRate={r => setReviewForm(f => ({ ...f, rating: r }))} />
              </div>
              <Textarea
                placeholder={t('reviews.commentPlaceholder')}
                value={reviewForm.comment}
                onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                className="rounded-xl resize-none"
                rows={3}
              />
              <Button
                onClick={submitReview}
                disabled={submittingReview || !reviewForm.name.trim()}
                className="w-full font-bold rounded-xl text-white bg-gradient-to-br from-brand-purple to-brand-cyan hover:opacity-95"
              >
                {submittingReview ? t('reviews.submitting') : t('reviews.submit')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-brand-purple/10 py-4 bg-white">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <p className="text-xs text-gray-400 flex items-center gap-2">
            <span>{t('store.poweredBy')}</span>
            <Link to="/" className="inline-flex items-center hover:opacity-90 transition-opacity">
              <BrandLogo height={22} />
            </Link>
          </p>
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-brand-purple/40 hover:text-brand-purple transition-colors"
          >
            {language === 'ar' ? 'EN' : 'ع'}
          </button>
        </div>
      </footer>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2 primary-gradient text-white rounded-full px-4 py-3 shadow-xl hover:scale-105 transition-transform"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-bold text-sm">{cartCount}</span>
        </button>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" dir="rtl">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">السلة ({cartCount})</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 bg-gray-50 rounded-2xl p-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center">
                    {product.image_url
                      ? <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                      : <Package className="h-6 w-6 text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{product.title}</p>
                    <p className="text-brand-purple font-bold text-sm">{(product.price * quantity).toFixed(3)} JOD</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => updateQty(product.id, -1)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQty(product.id, 1)}
                        className="w-6 h-6 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple hover:bg-brand-purple/20 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="mr-auto text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {hasDelivery && (
                <div className="bg-violet-50 rounded-xl p-3 flex gap-2 items-start">
                  <Truck className="h-4 w-4 text-brand-purple mt-0.5 shrink-0" />
                  <p className="text-xs text-brand-purple leading-relaxed">
                    التوصيل متاح لبعض المنتجات — سيتم تأكيد التفاصيل مع البائع
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">المجموع</span>
                <span className="text-xl font-extrabold text-brand-purple">{cartTotal.toFixed(3)} JOD</span>
              </div>
              <Button
                onClick={buildWhatsAppMessage}
                className="w-full gap-2 font-bold rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-base py-3 h-auto"
              >
                <MessageCircle className="h-5 w-5" />
                إتمام الطلب عبر واتساب
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxUrl(null)}
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="صورة المنتج"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default StorePage;
