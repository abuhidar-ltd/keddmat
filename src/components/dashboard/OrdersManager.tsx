import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Phone, MessageCircle, Clock, CheckCircle, XCircle, Eye, MapPin } from 'lucide-react';
import { getCurrencySymbol, COUNTRIES } from '@/components/CountryFilter';

interface OrderItem { id: string; item_title: string; item_price: number; quantity: number; }
interface Order { id: string; customer_name: string; customer_phone: string; customer_notes: string | null; total_amount: number; status: string; created_at: string; currency?: string; items?: OrderItem[]; }

const OrdersManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: t('orders.new'), color: 'bg-yellow-500', icon: <Clock className="h-3 w-3" /> },
    confirmed: { label: t('orders.confirmed'), color: 'bg-blue-500', icon: <CheckCircle className="h-3 w-3" /> },
    completed: { label: t('orders.completed'), color: 'bg-green-500', icon: <CheckCircle className="h-3 w-3" /> },
    cancelled: { label: t('orders.cancelled'), color: 'bg-red-500', icon: <XCircle className="h-3 w-3" /> },
  };

  useEffect(() => { if (user) fetchOrders(); }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('orders').select('*').eq('merchant_id', user.id).order('created_at', { ascending: false });
    if (error) toast({ title: t('common.error'), description: t('orders.loadError'), variant: 'destructive' });
    else setOrders(data || []);
    setLoading(false);
  };

  const fetchOrderItems = async (orderId: string) => { const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId); return data || []; };

  const handleViewDetails = async (order: Order) => { const items = await fetchOrderItems(order.id); setSelectedOrder({ ...order, items }); setDetailsOpen(true); };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) toast({ title: t('common.error'), description: t('orders.updateError'), variant: 'destructive' });
    else { toast({ title: t('orders.updated') }); fetchOrders(); }
  };

  const openWhatsApp = (phone: string, orderDetails: string) => {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone.startsWith('00') ? cleanPhone.slice(2) : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(`${t('orders.hello')}\n${orderDetails}`)}`, '_blank');
  };

  const getCountryFromPhone = (phone: string) => {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const prefixes: Record<string, { code: string; flag: string }> = { '962': { code: 'JO', flag: '🇯🇴' }, '966': { code: 'SA', flag: '🇸🇦' }, '971': { code: 'AE', flag: '🇦🇪' }, '20': { code: 'EG', flag: '🇪🇬' } };
    let p = cleanPhone; if (p.startsWith('+')) p = p.slice(1); if (p.startsWith('00')) p = p.slice(2);
    for (const [prefix, data] of Object.entries(prefixes)) {
      if (p.startsWith(prefix)) { const country = COUNTRIES.find(c => c.code === data.code); return { country: country ? (language === 'ar' ? country.name.ar : country.name.en) : data.code, flag: data.flag }; }
    }
    return null;
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div><h3 className="font-semibold">{t('orders.title')} ({orders.length})</h3></div>
      {orders.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center p-8 text-center"><Package className="h-12 w-12 text-muted-foreground mb-4" /><h4 className="font-semibold mb-2">{t('orders.noOrders')}</h4></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const customerCountry = getCountryFromPhone(order.customer_phone);
            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold">{order.customer_name}</h4>
                        <Badge className={`${status.color} text-white gap-1`}>{status.icon}{status.label}</Badge>
                        {customerCountry && <Badge variant="outline" className="gap-1 text-xs"><span>{customerCountry.flag}</span><span>{customerCountry.country}</span></Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-3 w-3" /><span dir="ltr">{order.customer_phone}</span></p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                      <p className="text-primary font-bold mt-1">{order.total_amount.toFixed(2)} {getCurrencySymbol(order.currency || 'JOD')}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)}>
                        <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t('orders.new')}</SelectItem>
                          <SelectItem value="confirmed">{t('orders.confirmed')}</SelectItem>
                          <SelectItem value="completed">{t('orders.completed')}</SelectItem>
                          <SelectItem value="cancelled">{t('orders.cancelled')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleViewDetails(order)}><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="outline" className="h-8 w-8" asChild><a href={`tel:${order.customer_phone}`}><Phone className="h-4 w-4" /></a></Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => openWhatsApp(order.customer_phone, `${t('orders.total')}: ${order.total_amount.toFixed(2)}`)}><MessageCircle className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('orders.details')}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                <p className="text-sm"><span className="font-medium">{t('orders.name')}:</span> {selectedOrder.customer_name}</p>
                <p className="text-sm flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><span dir="ltr">{selectedOrder.customer_phone}</span></p>
              </div>
              <div className="space-y-2">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm"><span>{item.item_title} × {item.quantity}</span><span className="font-medium">{(item.item_price * item.quantity).toFixed(2)}</span></div>
                ))}
              </div>
              <div className="border-t pt-2"><div className="flex justify-between font-bold"><span>{t('orders.total')}:</span><span className="text-primary">{selectedOrder.total_amount.toFixed(2)}</span></div></div>
              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" asChild><a href={`tel:${selectedOrder.customer_phone}`}><Phone className="mx-2 h-4 w-4" />{t('orders.call')}</a></Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => openWhatsApp(selectedOrder.customer_phone, selectedOrder.items?.map(i => `${i.item_title} × ${i.quantity}`).join('\n') + `\n${t('orders.total')}: ${selectedOrder.total_amount.toFixed(2)}`)}><MessageCircle className="mx-2 h-4 w-4" />{t('orders.whatsapp')}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManager;