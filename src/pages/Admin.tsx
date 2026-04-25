import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, CreditCard, Store, CheckCircle, XCircle, Eye, ShieldCheck, Package, Trash2, Star, MessageCircle, Phone, MapPin, Calendar, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NotificationBell from '@/components/NotificationBell';
import RatingStars from '@/components/RatingStars';
import { useAuth } from '@/hooks/useAuth';

interface Merchant { id: string; user_id: string; display_name: string | null; store_name: string | null; phone: string; page_enabled: boolean; page_slug: string | null; created_at: string; whatsapp_clicks?: number; call_clicks?: number; category?: string; address?: string; }
interface PaymentReceipt { id: string; user_id: string; receipt_url: string; amount: number; currency: string; status: string; payment_month: string; created_at: string; merchant_name?: string; merchant_phone?: string; payment_type?: string; }
interface Product { id: string; title: string; price: number; image_url: string | null; user_id: string; is_active: boolean; merchant_name?: string; }
interface AdminRating { id: string; merchant_id: string; customer_name: string; rating: number; comment: string | null; created_at: string; }

const SUPABASE_URL = "https://fooqrkdniswrzwgcytne.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvb3Fya2RuaXN3cnp3Z2N5dG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mzg5MTMsImV4cCI6MjA4ODMxNDkxM30.px0ExibFbOMoNBw-emojn6k3UbrHsZSda4oFTWPpOis";
const ADMIN_PASSWORD = "12345678";

const Admin = () => {
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();
  const { user } = useAuth();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [adminRatings, setAdminRatings] = useState<AdminRating[]>([]);
  const [kpis, setKpis] = useState<{ customers: number; craftsmen: number; whatsappClicks: number; callClicks: number }>({ customers: 0, craftsmen: 0, whatsappClicks: 0, callClicks: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    const hasAdminAccess = sessionStorage.getItem('adminAccess');
    if (!hasAdminAccess) { toast.error(t('admin.unauthorized')); navigate('/'); }
    else fetchData();
  }, [navigate]);

  const handleSignOut = () => { sessionStorage.removeItem('adminAccess'); navigate('/'); };

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-data?action=fetch`, {
        method: 'GET', headers: { 'x-admin-password': ADMIN_PASSWORD, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMerchants(data.merchants || []); setReceipts(data.receipts || []); setProducts(data.products || []); setAdminRatings(data.ratings || []);
      if (data.kpis) setKpis(data.kpis);
    } catch (error) { console.error(error); toast.error(t('common.error')); }
    finally { setLoadingData(false); }
  };

  const adminAction = async (type: string, data: any) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
        method: 'POST', headers: { 'x-admin-password': ADMIN_PASSWORD, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      });
      if (!res.ok) {
        let errorMessage = t('common.error');
        try {
          const errorBody = await res.json();
          if (errorBody?.error) errorMessage = errorBody.error;
        } catch (_) {}
        throw new Error(errorMessage);
      }
      return true;
    } catch (error) { console.error(error); toast.error(error instanceof Error ? error.message : t('common.error')); return false; }
  };

  const handleToggleStore = async (m: Merchant) => { if (await adminAction('toggle_store', { id: m.id, page_enabled: m.page_enabled })) { toast.success(m.page_enabled ? t('admin.storeClosed') : t('admin.storeActivated')); fetchData(); } };
  const handleReviewReceipt = async (id: string, approved: boolean) => { const r = receipts.find(r => r.id === id); if (await adminAction('review_receipt', { id, approved, user_id: r?.user_id })) { toast.success(approved ? t('admin.receiptApproved') : t('admin.receiptRejected')); setSelectedReceipt(null); fetchData(); } };
  const handleDeleteProduct = async (id: string) => { if (await adminAction('delete_product', { id })) { toast.success(t('admin.productDeleted')); fetchData(); } };
  const handleDeleteMerchant = async (id: string, userId: string, phone: string) => { if (!confirm(t('admin.confirmDeleteMerchant'))) return; if (await adminAction('delete_merchant', { id, user_id: userId, phone })) { toast.success(t('admin.merchantDeleted')); fetchData(); } };
  const handleDeleteRating = async (id: string) => { if (await adminAction('delete_rating', { id })) { toast.success(t('admin.ratingDeleted')); fetchData(); } };
  const handleDeleteAllAccounts = async () => {
    if (!confirm('⚠️ هل أنت متأكد أنك تريد حذف جميع الحسابات والبيانات نهائياً؟ هذا الإجراء لا يمكن التراجع عنه!')) return;
    if (!confirm('⚠️⚠️ تأكيد أخير: سيتم حذف كل التجار والعملاء والمنتجات والطلبات والتقييمات. هل تريد المتابعة؟')) return;
    toast.loading('جاري حذف جميع الحسابات...');
    const result = await adminAction('delete_all_accounts', {});
    toast.dismiss();
    if (result) { toast.success('تم حذف جميع الحسابات بنجاح'); fetchData(); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) { case 'approved': return <Badge className="bg-emerald-500 text-white">{t('admin.approved')}</Badge>; case 'rejected': return <Badge variant="destructive">{t('admin.rejected')}</Badge>; default: return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">{t('admin.pending')}</Badge>; }
  };

  const getPaymentTypeBadge = (type?: string) => {
    switch (type) {
      case 'cliq': return <Badge className="bg-blue-500 text-white gap-1"><Wallet className="h-3 w-3" />CliQ</Badge>;
      case 'extra_dish': return <Badge variant="outline" className="text-purple-600 border-purple-300 gap-1"><Package className="h-3 w-3" />{t('admin.extraService')}</Badge>;
      case 'stripe': return <Badge className="bg-indigo-500 text-white gap-1"><CreditCard className="h-3 w-3" />Stripe</Badge>;
      default: return <Badge variant="outline" className="gap-1"><CreditCard className="h-3 w-3" />{t('admin.subscription')}</Badge>;
    }
  };

  const filteredReceipts = paymentFilter === 'all' ? receipts : receipts.filter(r => r.status === paymentFilter);

  if (loadingData) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" /><h1 className="font-bold text-lg">{t('admin.title')}</h1></div>
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={handleDeleteAllAccounts} className="gap-1"><Trash2 className="h-4 w-4" />حذف الكل</Button>
            <NotificationBell /><Button variant="ghost" onClick={handleSignOut}><LogOut className="mx-2 h-4 w-4" />{t('dashboard.logout')}</Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">عدد العملاء</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><span className="text-2xl font-bold">{kpis.customers}</span></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">عدد الحرفيين</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Store className="h-5 w-5 text-emerald-500" /><span className="text-2xl font-bold">{kpis.craftsmen}</span></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">ضغطات واتساب</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-[#25D366]" /><span className="text-2xl font-bold">{kpis.whatsappClicks}</span></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">ضغطات الاتصال</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Phone className="h-5 w-5 text-blue-500" /><span className="text-2xl font-bold">{kpis.callClicks}</span></div></CardContent></Card>
        </div>

        <Tabs defaultValue="merchants" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-4 mb-6">
            <TabsTrigger value="merchants" className="gap-1"><Store className="h-4 w-4" />{t('admin.providers')}</TabsTrigger>
            <TabsTrigger value="products" className="gap-1"><Package className="h-4 w-4" />{t('admin.services')}</TabsTrigger>
            <TabsTrigger value="ratings" className="gap-1"><Star className="h-4 w-4" />{t('admin.ratingsTab')}</TabsTrigger>
            <TabsTrigger value="payments" className="gap-1"><CreditCard className="h-4 w-4" />{t('admin.paymentsTab')}</TabsTrigger>
          </TabsList>

          {/* ========== مقدمي الخدمات ========== */}
          <TabsContent value="merchants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                   <span>{t('admin.manageProviders')} ({merchants.length})</span>
                   <div className="flex gap-2 text-sm font-normal">
                     <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">{merchants.filter(m => m.page_enabled).length} {t('admin.active')}</Badge>
                     <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">{merchants.filter(m => !m.page_enabled).length} {t('admin.inactive')}</Badge>
                   </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {merchants.length === 0 ? <p className="text-center text-muted-foreground py-8">{t('admin.noProviders')}</p> : (
                  <div className="space-y-3">
                    {merchants.map((m) => (
                      <div key={m.id} className="border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-base">{m.display_name || m.store_name || t('admin.noName')}</h3>
                              {m.page_enabled
                                ? <Badge className="bg-emerald-500 text-white text-xs">{t('admin.active')}</Badge>
                                : <Badge variant="secondary" className="text-xs">{t('admin.inactive')}</Badge>
                              }
                              {m.category && <Badge variant="outline" className="text-xs">{m.category}</Badge>}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1" dir="ltr"><Phone className="h-3.5 w-3.5" />{m.phone}</span>
                              {m.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{m.address}</span>}
                              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(m.created_at).toLocaleDateString('ar-JO')}</span>
                              <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />{m.whatsapp_clicks || 0} {t('admin.whatsappClicks')}</span>
                              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-blue-500" />{m.call_clicks || 0} {language === 'ar' ? 'اتصال' : 'calls'}</span>
                              {m.page_slug && <a href={`/p/${m.page_slug}`} target="_blank" className="text-primary hover:underline text-xs">/{m.page_slug}</a>}
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant={m.page_enabled ? "destructive" : "default"}
                              onClick={() => handleToggleStore(m)}
                              className="gap-1"
                            >
                              {m.page_enabled ? <><XCircle className="h-4 w-4" />{t('admin.close')}</> : <><CheckCircle className="h-4 w-4" />{t('admin.activate')}</>}
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground gap-1" onClick={() => handleDeleteMerchant(m.id, m.user_id, m.phone)}>
                              <Trash2 className="h-4 w-4" />{t('admin.delete')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== الخدمات ========== */}
          <TabsContent value="products">
            <Card><CardHeader><CardTitle>{t('admin.manageServices')} ({products.length})</CardTitle></CardHeader>
              <CardContent>
                {products.length === 0 ? <p className="text-center text-muted-foreground py-8">{t('admin.noServices')}</p> : (
                  <Table><TableHeader><TableRow><TableHead>{t('admin.service')}</TableHead><TableHead>{t('admin.provider')}</TableHead><TableHead>{t('admin.price')}</TableHead><TableHead>{t('admin.actions')}</TableHead></TableRow></TableHeader>
                    <TableBody>{products.map((p) => (
                      <TableRow key={p.id}><TableCell><div className="flex items-center gap-2">{p.image_url ? <img src={p.image_url} alt={p.title} className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>}<span className="font-medium">{p.title}</span></div></TableCell>
                        <TableCell>{p.merchant_name}</TableCell><TableCell>{p.price} د.أ</TableCell>
                        <TableCell><Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(p.id)} className="gap-1"><Trash2 className="h-4 w-4" />{t('admin.delete')}</Button></TableCell>
                      </TableRow>))}</TableBody></Table>
                )}
              </CardContent></Card>
          </TabsContent>

          {/* ========== التقييمات ========== */}
          <TabsContent value="ratings">
            <Card><CardHeader><CardTitle>{t('admin.allRatings')} ({adminRatings.length})</CardTitle></CardHeader>
              <CardContent>
                {adminRatings.length === 0 ? <p className="text-center text-muted-foreground py-8">{t('admin.noRatings')}</p> : (
                  <Table><TableHeader><TableRow><TableHead>{t('admin.customer')}</TableHead><TableHead>{t('admin.rating')}</TableHead><TableHead>{t('admin.comment')}</TableHead><TableHead>{t('admin.date')}</TableHead><TableHead>{t('admin.actions')}</TableHead></TableRow></TableHeader>
                    <TableBody>{adminRatings.map((r) => (
                      <TableRow key={r.id}><TableCell>{r.customer_name}</TableCell><TableCell><RatingStars rating={r.rating} size={14} /></TableCell><TableCell className="max-w-[200px] truncate">{r.comment || '-'}</TableCell><TableCell>{new Date(r.created_at).toLocaleDateString('ar-JO')}</TableCell>
                        <TableCell><Button size="sm" variant="destructive" onClick={() => handleDeleteRating(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>))}</TableBody></Table>
                )}
              </CardContent></Card>
          </TabsContent>

          {/* ========== المدفوعات ========== */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <span>{t('admin.managePayments')} ({receipts.length})</span>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant={paymentFilter === 'all' ? 'default' : 'outline'} onClick={() => setPaymentFilter('all')}>{t('admin.all')} ({receipts.length})</Button>
                    <Button size="sm" variant={paymentFilter === 'pending' ? 'default' : 'outline'} className={paymentFilter === 'pending' ? '' : 'text-amber-600 border-amber-300'} onClick={() => setPaymentFilter('pending')}>{t('admin.pending')} ({receipts.filter(r => r.status === 'pending').length})</Button>
                    <Button size="sm" variant={paymentFilter === 'approved' ? 'default' : 'outline'} className={paymentFilter === 'approved' ? '' : 'text-emerald-600 border-emerald-300'} onClick={() => setPaymentFilter('approved')}>{t('admin.approved')} ({receipts.filter(r => r.status === 'approved').length})</Button>
                    <Button size="sm" variant={paymentFilter === 'rejected' ? 'default' : 'outline'} className={paymentFilter === 'rejected' ? '' : 'text-red-600 border-red-300'} onClick={() => setPaymentFilter('rejected')}>{t('admin.rejected')} ({receipts.filter(r => r.status === 'rejected').length})</Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredReceipts.length === 0 ? <p className="text-center text-muted-foreground py-8">{t('admin.noReceipts')}</p> : (
                  <div className="space-y-3">
                    {filteredReceipts.map((r) => (
                      <div key={r.id} className={`border rounded-xl p-4 transition-shadow hover:shadow-md ${r.status === 'pending' ? 'border-amber-300 bg-amber-50/30' : r.status === 'approved' ? 'border-emerald-300 bg-emerald-50/30' : r.status === 'rejected' ? 'border-red-300 bg-red-50/30' : 'border-border'}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold">{r.merchant_name || language === 'ar' ? 'غير معروف' : 'Unknown'}</h3>
                              {getStatusBadge(r.status)}
                              {getPaymentTypeBadge(r.payment_type)}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1" dir="ltr"><Phone className="h-3.5 w-3.5" />{r.merchant_phone}</span>
                              <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />{r.amount} {r.currency}</span>
                              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{language === 'ar' ? 'شهر' : 'Month'}: {r.payment_month}</span>
                              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(r.created_at).toLocaleDateString('ar-JO')}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="outline" onClick={() => setSelectedReceipt(r.receipt_url)} className="gap-1">
                              <Eye className="h-4 w-4" />{t('admin.viewReceipt')}
                            </Button>
                            {r.status === 'pending' && (
                              <>
                                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1" onClick={() => handleReviewReceipt(r.id, true)}>
                                  <CheckCircle className="h-4 w-4" />{t('admin.accept')}
                                </Button>
                                <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleReviewReceipt(r.id, false)}>
                                  <XCircle className="h-4 w-4" />{t('admin.reject')}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{t('admin.viewReceipt')}</DialogTitle><DialogDescription>{language === 'ar' ? 'صورة إيصال الدفع' : 'Payment receipt image'}</DialogDescription></DialogHeader>
          {selectedReceipt && <div className="flex justify-center"><img src={selectedReceipt} alt={t('admin.viewReceipt')} className="max-w-full max-h-[60vh] object-contain rounded-lg" /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;