import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart, CartItem } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Package, ExternalLink, MessageCircle, CheckCircle, Loader2, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Cart = () => {
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const { items, updateQuantity, removeItem, getTotal, clearMerchantItems } = useCart();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [submittingMerchant, setSubmittingMerchant] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<{ name: string; phone: string } | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);

  useEffect(() => {
    const fetchCustomerInfo = async () => {
      if (!user) return;
      const { data } = await supabase.from('customer_profiles').select('display_name, phone').eq('user_id', user.id).maybeSingle();
      if (data) setCustomerInfo({ name: data.display_name || '', phone: data.phone || '' });
    };
    fetchCustomerInfo();
  }, [user]);

  const handleConfirmOrder = async (merchantId: string, merchantItems: CartItem[], total: number) => {
    if (!user) { toast({ title: t('cart.loginToConfirm'), description: t('cart.loginToContinue'), variant: 'destructive' }); navigate('/auth?redirect=/cart'); return; }
    if (!termsAgreed) { toast({ title: t('auth.agreeRequired'), variant: 'destructive' }); return; }
    const userPhone = user?.email?.replace('.customer@phone.local', '').replace('.merchant@phone.local', '').replace('@phone.local', '') || '';
    const customerName = customerInfo?.name || userPhone || 'زائر';
    const customerPhone = customerInfo?.phone || userPhone || '';
    setSubmittingMerchant(merchantId);
    try {
      const itemIds = merchantItems.map(item => item.id);
      const { data: availableItems, error: checkError } = await supabase.from('items').select('id, price, title, is_active').in('id', itemIds).eq('is_active', true);
      if (checkError) throw checkError;
      const availableItemIds = new Set(availableItems?.map(item => item.id) || []);
      const unavailableItems = merchantItems.filter(item => !availableItemIds.has(item.id));
      if (unavailableItems.length > 0) { unavailableItems.forEach(item => removeItem(item.id)); toast({ title: t('cart.itemsUnavailable'), description: t('cart.someItemsRemoved'), variant: 'destructive' }); return; }
      const verifiedTotal = merchantItems.reduce((sum, item) => { const v = availableItems?.find(ai => ai.id === item.id); return sum + (v?.price || item.price) * item.quantity; }, 0);
      const { data: order, error: orderError } = await supabase.from('orders').insert({ merchant_id: merchantId, customer_id: user.id, customer_name: customerName, customer_phone: customerPhone, total_amount: verifiedTotal, currency: merchantItems[0]?.currency || 'JOD', status: 'pending' }).select().single();
      if (orderError) throw orderError;
      const orderItems = merchantItems.map(item => { const v = availableItems?.find(ai => ai.id === item.id); return { order_id: order.id, item_id: item.id, item_title: v?.title || item.title, item_price: v?.price || item.price, quantity: item.quantity }; });
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;
      clearMerchantItems(merchantId);
      toast({ title: t('cart.orderConfirmed'), description: t('cart.orderSentToMerchant') });
      const merchantSlug = merchantItems[0]?.merchant_slug;
      if (merchantSlug) navigate(`/p/${merchantSlug}`, { state: { orderConfirmed: true } });
    } catch (error) { console.error('Error:', error); toast({ title: t('common.error'), description: t('cart.orderFailed'), variant: 'destructive' }); }
    finally { setSubmittingMerchant(null); }
  };

  useEffect(() => { if (userType === 'merchant') { toast({ title: t('auth.notForMerchants'), description: t('auth.merchantCantBuy'), variant: 'destructive' }); navigate('/'); } }, [userType]);

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.merchant_id]) acc[item.merchant_id] = { merchant_name: item.merchant_name, merchant_slug: item.merchant_slug, items: [], subtotal: 0, deliveryTotal: 0, total: 0 };
    acc[item.merchant_id].items.push(item);
    const itemTotal = item.price * item.quantity;
    const deliveryCost = (item.has_delivery && item.delivery_cost) ? item.delivery_cost * item.quantity : 0;
    acc[item.merchant_id].subtotal += itemTotal;
    acc[item.merchant_id].deliveryTotal += deliveryCost;
    acc[item.merchant_id].total += itemTotal + deliveryCost;
    return acc;
  }, {} as Record<string, { merchant_name: string; merchant_slug?: string; items: CartItem[]; subtotal: number; deliveryTotal: number; total: number }>);

  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#EFF3F8]">
        <Header />
        <main className="container py-16 px-4">
          <Card className="max-w-md mx-auto text-center rounded-2xl border-[#E5E7EB] shadow-md">
            <CardContent className="py-12">
              <ShoppingCart className="h-16 w-16 text-[#165B91]/30 mx-auto mb-4" />
              <h2 className="text-xl font-extrabold mb-2 text-[#1A1A2E]">{t('cart.empty')}</h2>
              <p className="text-[#6B7280] mb-6">{t('cart.noProducts')}</p>
              <Button asChild className="btn-cta border-0 rounded-xl px-6">
                <Link to="/browse">{t('cart.browseProducts')}</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFF3F8]">
      <Header />
      <main className="container py-8 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" asChild className="text-[#165B91] hover:bg-[#165B91]/5">
            <Link to="/browse"><ArrowIcon className="h-4 w-4 mx-1" />{t('cart.continueShopping')}</Link>
          </Button>
        </div>
        <h1 className="text-2xl font-extrabold mb-6 text-[#1A1A2E]">{t('cart.title')}</h1>
        <div className="space-y-6 max-w-3xl">
          {Object.entries(groupedItems).map(([merchantId, group]) => (
            <Card key={merchantId} className="rounded-2xl border-[#E5E7EB] shadow-md overflow-hidden">
              {/* Card header with green accent */}
              <CardHeader className="pb-3 bg-[#165B91]/5 border-b border-[#E5E7EB]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-[#1A1A2E]">
                    <Package className="h-5 w-5 text-[#165B91]" />{group.merchant_name}
                  </CardTitle>
                  <div className="flex gap-2">
                    {group.merchant_slug && (
                      <Button asChild size="sm" variant="outline" className="border-[#165B91]/30 text-[#165B91] hover:bg-[#165B91]/5">
                        <Link to={`/p/${group.merchant_slug}`}><ExternalLink className="h-4 w-4 mx-1" />{t('cart.viewCookPage')}</Link>
                      </Button>
                    )}
                    <button
                      onClick={() => handleConfirmOrder(merchantId, group.items, group.total)}
                      disabled={submittingMerchant === merchantId || !user || !termsAgreed}
                      className="btn-cta px-4 py-1.5 text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingMerchant === merchantId
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <CheckCircle className="h-4 w-4" />
                      }
                      {t('cart.confirmOrder')}
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {group.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-[#EFF3F8] overflow-hidden flex-shrink-0 border border-[#E5E7EB]">
                      {item.image_url
                        ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-[#165B91]/20" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate text-[#1A1A2E]">{item.title}</h4>
                      <p className="text-[#165B91] font-bold">{item.price.toFixed(2)} {item.currency}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="icon" variant="outline" className="h-7 w-7 border-[#E5E7EB]" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-8 text-center font-bold text-[#1A1A2E]">{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7 border-[#E5E7EB]" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive ms-auto" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Separator className="bg-[#E5E7EB]" />
                <div className="flex items-center justify-between font-bold">
                  <span className="text-[#6B7280]">{t('cart.subtotal')}:</span>
                  <span className="text-[#165B91] text-lg">{group.total.toFixed(2)} {group.items[0]?.currency || 'د.أ'}</span>
                </div>
                {!user && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
                    <p className="mb-2 font-semibold text-red-600">{t('cart.loginToConfirm')}</p>
                    <p className="mb-3 text-[#6B7280]">{t('cart.loginToContinue')}</p>
                    <Button size="sm" className="btn-cta border-0 rounded-xl" onClick={() => navigate('/auth?redirect=/cart')}>
                      {t('header.login')}
                    </Button>
                  </div>
                )}
                <div className="flex items-start gap-3 rounded-xl bg-[#165B91]/5 border border-[#165B91]/15 p-3">
                  <Checkbox
                    id={`terms-${merchantId}`}
                    checked={termsAgreed}
                    onCheckedChange={(v) => setTermsAgreed(!!v)}
                    className="mt-0.5 border-[#165B91] data-[state=checked]:bg-[#165B91]"
                  />
                  <label htmlFor={`terms-${merchantId}`} className="text-sm leading-relaxed cursor-pointer text-[#1A1A2E]">
                    {t('auth.agreeTerms')}{' '}
                    <Link to="/terms" className="text-[#165B91] underline font-semibold">
                      {t('auth.termsLink')}
                    </Link>
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Cart;