import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Package, Loader2, Camera, X } from 'lucide-react';
import type { Product } from '@/types/keddmat';

const emptyForm = { title: '', description: '', price: '', delivery_available: false, delivery_price: '', image_url: '' };

const ProductsManager = () => {
  const { user } = useAuth();
  const { uploadImage, uploading } = useImageUpload();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setForm({ title: p.title, description: p.description || '', price: String(p.price), delivery_available: p.delivery_available, delivery_price: p.delivery_price ? String(p.delivery_price) : '', image_url: p.image_url || '' });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const url = await uploadImage(file, user.id, 'products');
    if (url) setForm(prev => ({ ...prev, image_url: url }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: 'الاسم مطلوب', variant: 'destructive' }); return; }
    const price = parseFloat(form.price) || 0;
    if (price < 0) { toast({ title: 'السعر يجب أن يكون رقماً موجباً', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = {
      user_id: user!.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      price,
      image_url: form.image_url || null,
      delivery_available: form.delivery_available,
      delivery_price: form.delivery_available && form.delivery_price ? parseFloat(form.delivery_price) : null,
    };
    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (error) { toast({ title: 'فشل التحديث', description: error.message, variant: 'destructive' }); }
      else { toast({ title: 'تم التحديث ✓' }); }
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { toast({ title: 'فشل الإضافة', description: error.message, variant: 'destructive' }); }
      else { toast({ title: 'تم إضافة المنتج ✓' }); }
    }
    setSaving(false);
    setDialogOpen(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast({ title: 'فشل الحذف', variant: 'destructive' }); }
    else { toast({ title: 'تم الحذف' }); fetchProducts(); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-purple" /></div>;

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{products.length} منتج</p>
        <Button onClick={openAdd} className="font-bold gap-2 rounded-xl text-white bg-gradient-to-br from-brand-purple to-brand-cyan hover:opacity-95">
          <Plus className="h-4 w-4" />إضافة منتج +
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Package className="h-14 w-14 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">لا توجد منتجات بعد</p>
          <p className="text-sm mt-1">ابدأ بإضافة منتجاتك</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map(p => (
            <Card key={p.id} className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border-0 bg-white">
              <div className="w-full aspect-[3/4] max-h-44 md:max-h-none overflow-hidden flex items-center justify-center bg-gray-100">
                {p.image_url
                  ? <img
                      src={p.image_url}
                      alt={p.title}
                      className="w-full h-full object-cover object-center cursor-zoom-in"
                      onClick={() => setLightboxUrl(p.image_url)}
                    />
                  : <Package className="h-10 w-10 text-gray-300" />}
              </div>
              <CardContent className="p-3 space-y-2">
                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{p.title}</h3>
                {p.description && <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-brand-purple text-sm">{p.price} JOD</span>
                  {p.delivery_available && (
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-0">
                      توصيل {p.delivery_price ? `${p.delivery_price} JOD` : ''}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)} className="flex-1 gap-1 rounded-xl text-xs h-8">
                    <Pencil className="h-3 w-3" />تعديل
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(p.id)} className="gap-1 rounded-xl text-xs h-8 border-red-200 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-bold text-brand-purple">{editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image */}
            <div className="space-y-2">
              <Label className="font-semibold">صورة المنتج</Label>
              <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 group cursor-pointer">
                {form.image_url
                  ? <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex flex-col items-center justify-center gap-2"><Camera className="h-8 w-8 text-gray-400" /><span className="text-xs text-gray-400">انقر لرفع صورة</span></div>}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-sm font-bold">{uploading ? 'جاري الرفع...' : 'تغيير الصورة'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="font-semibold">اسم المنتج <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="اسم المنتج" className="h-11 rounded-xl" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="font-semibold">الوصف</Label>
              <Textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="وصف مختصر..." className="rounded-xl resize-none" rows={2} />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label className="font-semibold">السعر (JOD)</Label>
              <Input type="number" min="0" step="0.001" value={form.price} onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))} placeholder="0.000" className="h-11 rounded-xl" dir="ltr" />
            </div>

            {/* Delivery */}
            <div className="flex items-center justify-between p-3 border rounded-xl">
              <Label className="font-semibold cursor-pointer" htmlFor="delivery-toggle">توصيل متاح</Label>
              <Switch id="delivery-toggle" checked={form.delivery_available} onCheckedChange={val => setForm(prev => ({ ...prev, delivery_available: val }))} />
            </div>

            {form.delivery_available && (
              <div className="space-y-2">
                <Label className="font-semibold">سعر التوصيل (JOD)</Label>
                <Input type="number" min="0" step="0.001" value={form.delivery_price} onChange={e => setForm(prev => ({ ...prev, delivery_price: e.target.value }))} placeholder="0.000" className="h-11 rounded-xl" dir="ltr" />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 rounded-xl">إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || uploading} className="flex-1 font-bold rounded-xl text-white bg-gradient-to-br from-brand-purple to-brand-cyan hover:opacity-95">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default ProductsManager;
