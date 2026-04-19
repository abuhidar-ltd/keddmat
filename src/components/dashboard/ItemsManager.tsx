import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useNativeImagePicker } from '@/hooks/useNativeImagePicker';
import { Loader2, Plus, Pencil, Trash2, Package, ImagePlus, X, AlertTriangle, CreditCard, Gift } from 'lucide-react';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Item { id: string; title: string; description: string | null; price: number; image_url: string | null; is_active: boolean; sort_order: number; category: string | null; }

interface ItemsManagerProps { onNavigateToPayment?: () => void; }

const ItemsManager = ({ onNavigateToPayment }: ItemsManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { isActive: hasActiveSubscription, loading: subscriptionLoading, canStartFreeTrial, startFreeTrial } = useSubscription();
  const [startingTrial, setStartingTrial] = useState(false);
  const { uploadImage, uploading, deleteImage } = useImageUpload({ maxWidth: 400, maxHeight: 400, quality: 0.75 });
  const { pickImage } = useNativeImagePicker();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', image_url: null as string | null, price: '' });
  const [userCategory, setUserCategory] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [extraItemsPaid, setExtraItemsPaid] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const itemSchema = z.object({ title: z.string().min(1, t('items.titleRequired')).max(200), description: z.string().max(1000).optional() });

  useEffect(() => { if (user) { fetchItems(); fetchExtraItemsPaid(); fetchUserCategory(); } }, [user]);

  const fetchUserCategory = async () => { if (!user) return; const { data } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).single(); if (data?.display_name) setUserCategory(data.display_name); };

  const fetchExtraItemsPaid = async () => { if (!user) return; const { data } = await supabase.from('profiles').select('extra_items_paid').eq('user_id', user.id).single(); if (data) setExtraItemsPaid(data.extra_items_paid || 0); };
  const fetchItems = async () => { if (!user) return; const { data, error } = await supabase.from('items').select('*').eq('user_id', user.id).order('sort_order', { ascending: true }); if (error) { toast({ title: t('common.error'), description: t('items.loadError'), variant: 'destructive' }); } else { setItems(data || []); } setLoading(false); };
  
  const openAddDialog = () => { setEditingItem(null); setFormData({ title: '', description: '', image_url: null, price: '' }); setErrors({}); setDialogOpen(true); };
  const openEditDialog = (item: Item) => { setEditingItem(item); setFormData({ title: item.title, description: item.description || '', image_url: item.image_url, price: item.price ? String(item.price) : '' }); setErrors({}); setDialogOpen(true); };

  const processImageFile = async (file: File) => {
    if (!user) return; toast({ title: t('items.uploadingImage'), description: t('items.pleaseWait') });
    try {
      if (formData.image_url) await deleteImage(formData.image_url);
      const url = await uploadImage(file, user.id, 'products');
      if (url) { setFormData(prev => ({ ...prev, image_url: url })); toast({ title: t('items.imageUploaded'), description: t('items.imageUploadedDesc') }); }
      else { toast({ title: t('common.error'), description: t('items.imageUploadError'), variant: 'destructive' }); }
    } catch (error) { toast({ title: t('common.error'), description: t('items.imageUploadError'), variant: 'destructive' }); }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; await processImageFile(file); };
  const handleNativeImagePick = async () => { try { const file = await pickImage(imageInputRef); if (file) await processImageFile(file); } catch (err: any) { toast({ title: 'خطأ', description: err.message, variant: 'destructive' }); } };
  const removeImage = async () => { if (formData.image_url) { await deleteImage(formData.image_url); setFormData({ ...formData, image_url: null }); } };

  const handleSave = async () => {
    const result = itemSchema.safeParse({ title: formData.title, description: formData.description || undefined });
    if (!result.success) { const fieldErrors: Record<string, string> = {}; result.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[err.path[0] as string] = err.message; }); setErrors(fieldErrors); return; }
    if (!user) return;
    setSaving(true);
    const priceNum = formData.price ? parseFloat(formData.price) : 0;
    if (editingItem) {
      const { error } = await supabase.from('items').update({ title: formData.title, description: formData.description || null, price: priceNum, image_url: formData.image_url, category: userCategory }).eq('id', editingItem.id);
      if (error) { toast({ title: t('common.error'), description: t('items.updateError'), variant: 'destructive' }); } else { toast({ title: t('items.updated'), description: t('items.itemUpdated') }); setDialogOpen(false); fetchItems(); }
    } else {
      const { error } = await supabase.from('items').insert({ user_id: user.id, title: formData.title, description: formData.description || null, price: priceNum, image_url: formData.image_url, category: userCategory, sort_order: items.length });
      if (error) { if (error.message.includes('الحد الأقصى')) { toast({ title: t('items.maxReached'), description: t('items.maxItems'), variant: 'destructive' }); } else { toast({ title: t('common.error'), description: t('items.addError'), variant: 'destructive' }); } } else { toast({ title: t('items.added'), description: t('items.itemAdded') }); setDialogOpen(false); fetchItems(); }
    }
    setSaving(false);
  };

  const handleDelete = async (item: Item) => {
    if (item.image_url) await deleteImage(item.image_url);
    const { error } = await supabase.from('items').delete().eq('id', item.id);
    if (error) { toast({ title: t('common.error'), description: t('items.deleteError'), variant: 'destructive' }); } else { toast({ title: t('items.deleted'), description: t('items.itemDeleted') }); fetchItems(); }
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    const confirmed = window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف جميع الصور؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete all photos? This cannot be undone.');
    if (!confirmed) return;
    for (const item of items) {
      if (item.image_url) await deleteImage(item.image_url);
    }
    const { error } = await supabase.from('items').delete().eq('user_id', user.id);
    if (error) { toast({ title: t('common.error'), description: t('items.deleteError'), variant: 'destructive' }); } else { toast({ title: t('items.deleted'), description: language === 'ar' ? 'تم حذف جميع الصور' : 'All photos deleted' }); fetchItems(); }
  };

  if (loading || subscriptionLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!hasActiveSubscription) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between"><div><h3 className="font-semibold">{language === 'ar' ? 'الصور' : 'Photos'} ({items.length}/10)</h3><p className="text-sm text-muted-foreground">{language === 'ar' ? 'أضف صور لأعمالك' : 'Add photos of your work'}</p></div></div>
        {canStartFreeTrial ? (
          <Alert className="border-primary/50 bg-primary/10">
            <Gift className="h-5 w-5 text-primary" /><AlertTitle className="text-lg font-bold text-primary">🎉 {t('subscription.freeTrialAvailable')}</AlertTitle>
            <AlertDescription className="mt-2"><p className="mb-4">{language === 'ar' ? 'ابدأ اشتراكك المجاني لمدة شهرين بدون أي دفع' : 'Start your free 2-month subscription without any payment'}</p><Button onClick={async () => { setStartingTrial(true); const success = await startFreeTrial(); setStartingTrial(false); if (success) toast({ title: t('subscription.trialActivated'), description: t('subscription.trialActivatedDesc') }); else toast({ title: t('common.error'), description: t('subscription.trialError'), variant: 'destructive' }); }} disabled={startingTrial} size="lg" className="gap-2 h-14 text-lg font-bold"><Gift className="h-5 w-5" />{startingTrial ? t('common.loading') : (language === 'ar' ? 'ابدأ الاشتراك المجاني (شهرين)' : 'Start Free Subscription (2 Months)')}</Button></AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10"><AlertTriangle className="h-5 w-5" /><AlertTitle className="text-lg font-bold">{t('items.subscriptionRequired')}</AlertTitle><AlertDescription className="mt-2"><p className="mb-4">{t('items.subscriptionRequiredDesc')}</p><Button onClick={onNavigateToPayment} className="gap-2"><CreditCard className="h-4 w-4" />{t('items.goToPayment')}</Button></AlertDescription></Alert>
        )}
        {items.length > 0 && <div className="grid gap-3 sm:grid-cols-2 opacity-60">{items.map((item) => (<Card key={item.id} className="overflow-hidden"><CardContent className="p-0"><div className="flex"><div className="w-24 h-24 flex-shrink-0 bg-muted">{item.image_url ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground/50" /></div>}</div><div className="flex-1 p-3 flex flex-col justify-between min-w-0"><div><h4 className="font-semibold text-sm truncate">{item.title}</h4>{item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}</div></div></div></CardContent></Card>))}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
      <div className="flex items-center justify-between">
        <div><h3 className="font-semibold">{language === 'ar' ? 'الصور' : 'Photos'} ({items.length}/{10 + extraItemsPaid})</h3><p className="text-sm text-muted-foreground">{language === 'ar' ? 'أضف صور لأعمالك' : 'Add photos of your work'}</p></div>
        <div className="flex items-center gap-2">
          {items.length > 0 && <Button variant="destructive" size="sm" onClick={handleDeleteAll}><Trash2 className="mx-1 h-4 w-4" />حذف الكل</Button>}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button onClick={openAddDialog} disabled={items.length >= (10 + extraItemsPaid)}><Plus className="mx-2 h-4 w-4" />{language === 'ar' ? 'إضافة صور' : 'Add Photos'}</Button></DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
              <DialogHeader className="flex-shrink-0"><DialogTitle>{editingItem ? (language === 'ar' ? 'تعديل' : 'Edit') : (language === 'ar' ? 'إضافة صورة جديدة' : 'Add New Photo')}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4 overflow-y-auto flex-1 px-1 relative">
                <div className="space-y-2">
                  <Label>{t('items.productImage')}</Label>
                  <div className="flex items-center gap-4">
                    {formData.image_url ? (
                      <div className="relative"><img src={formData.image_url} alt="" className="w-20 h-20 rounded-xl object-cover border border-border" /><Button size="icon" variant="destructive" onClick={removeImage} disabled={uploading} className="absolute -top-2 -start-2 h-6 w-6 rounded-full"><X className="h-3 w-3" /></Button></div>
                    ) : (
                      <div onClick={handleNativeImagePick} className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors bg-muted/50">{uploading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}</div>
                    )}
                    <div className="flex-1"><Button variant="outline" size="sm" onClick={handleNativeImagePick} disabled={uploading}>{uploading ? t('items.uploading') : formData.image_url ? t('items.changeImage') : t('items.uploadImage')}</Button><p className="text-xs text-muted-foreground mt-1">{t('items.imageNote')}</p></div>
                  </div>
                </div>
                <div className="space-y-2"><Label htmlFor="item-title">{language === 'ar' ? 'عنوان الصورة' : 'Photo Title'} *</Label><Input id="item-title" placeholder={language === 'ar' ? 'مثال: تمديدات كهربائية' : 'e.g. Electrical work'} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} maxLength={200} />{errors.title && <p className="text-sm text-destructive">{errors.title}</p>}</div>
                <div className="space-y-2"><Label htmlFor="item-description">{language === 'ar' ? 'وصف الصورة' : 'Photo Description'}</Label><Textarea id="item-description" placeholder={language === 'ar' ? 'أضف وصف لهذا العمل...' : 'Add a description for this work...'} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} maxLength={1000} /></div>
                <div className="space-y-2"><Label htmlFor="item-price">{language === 'ar' ? 'السعر (دينار) - اختياري' : 'Price (JOD) - Optional'}</Label><Input id="item-price" type="number" min="0" step="0.5" placeholder={language === 'ar' ? 'مثال: 25' : 'e.g. 25'} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} /><p className="text-xs text-muted-foreground">{language === 'ar' ? 'اتركه فارغاً إذا لم ترغب بعرض سعر' : 'Leave empty if you do not want to show a price'}</p></div>
                <Button onClick={handleSave} disabled={saving || uploading} className="w-full">{saving ? <><Loader2 className="mx-2 h-4 w-4 animate-spin" />{t('items.saving')}</> : editingItem ? t('common.update') : t('common.add')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center p-8 text-center"><Package className="h-12 w-12 text-muted-foreground mb-4" /><h4 className="font-semibold mb-2">{language === 'ar' ? 'لا توجد صور بعد' : 'No photos yet'}</h4><p className="text-sm text-muted-foreground mb-4">{language === 'ar' ? 'ابدأ بإضافة صور لأعمالك' : 'Start adding photos of your work'}</p><Button onClick={openAddDialog}><Plus className="mx-2 h-4 w-4" />{language === 'ar' ? 'إضافة صور' : 'Add Photos'}</Button></CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-24 h-24 flex-shrink-0 bg-muted">{item.image_url ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground/50" /></div>}</div>
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div><h4 className="font-semibold text-sm truncate">{item.title}</h4>{item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}{item.price > 0 && <p className="text-sm font-bold text-primary mt-1">{item.price} {language === 'ar' ? 'د.أ' : 'JOD'}</p>}</div>
                    <div className="flex items-center justify-end mt-1"><div className="flex items-center gap-1"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditDialog(item)}><Pencil className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" className="text-destructive h-7 w-7" onClick={() => handleDelete(item)}><Trash2 className="h-3.5 w-3.5" /></Button></div></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {items.length >= (5 + extraItemsPaid) && (
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-full bg-primary/20"><Plus className="h-5 w-5 text-primary" /></div><div><p className="font-semibold">{t('items.maxReached')}</p><p className="text-sm text-muted-foreground">{t('items.buyExtraDesc')}</p></div></div>
            <div className="bg-background rounded-lg p-3 mb-3 space-y-1 text-sm"><div className="flex justify-between items-center"><span className="text-muted-foreground">{t('payment.cliqAlias')}:</span><span className="font-mono font-bold">FATIMAISSA</span></div><div className="flex justify-between items-center"><span className="text-muted-foreground">{t('payment.amount')}:</span><span className="font-bold text-primary">5 {t('payment.jod')}</span></div></div>
            <div className="space-y-2">
              <input type="file" accept="image/*" className="hidden" id="extra-dish-receipt" onChange={async (e) => { const file = e.target.files?.[0]; if (!file || !user) return; if (file.size > 5 * 1024 * 1024) { toast({ title: t('payment.fileTooLarge'), description: t('payment.maxSize'), variant: 'destructive' }); return; } setSaving(true); try { const fileName = `${user.id}/${Date.now()}_extra_${file.name}`; const { error: upErr } = await supabase.storage.from('user-uploads').upload(fileName, file); if (upErr) throw upErr; const { data: urlData } = supabase.storage.from('user-uploads').getPublicUrl(fileName); const { error: insertErr } = await supabase.from('payment_receipts').insert({ user_id: user.id, receipt_url: urlData.publicUrl, amount: 5, currency: 'JOD', payment_month: new Date().toISOString().slice(0, 10), payment_type: 'extra_dish' }); if (insertErr) throw insertErr; toast({ title: t('payment.receiptUploaded'), description: t('payment.receiptUploadedDesc') }); } catch (err: any) { toast({ title: t('common.error'), description: err.message, variant: 'destructive' }); } setSaving(false); }} />
              <Button className="w-full gap-2" variant="outline" onClick={() => document.getElementById('extra-dish-receipt')?.click()} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}{language === 'ar' ? 'رفع وصل الدفع لإضافة صورة إضافية' : 'Upload receipt for extra photo'}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ItemsManager;