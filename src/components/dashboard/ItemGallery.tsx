import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useNativeImagePicker } from '@/hooks/useNativeImagePicker';
import { Loader2, Plus, X, Images } from 'lucide-react';

interface ItemImage { id: string; image_url: string; sort_order: number; }
interface ItemGalleryProps { itemId: string; userId: string; }

const ItemGallery = ({ itemId, userId }: ItemGalleryProps) => {
  const { toast } = useToast();
  const { uploadImage, uploading, deleteImage } = useImageUpload({ maxWidth: 600, maxHeight: 600, quality: 0.8 });
  const { pickImage } = useNativeImagePicker();
  const [images, setImages] = useState<ItemImage[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchImages(); }, [itemId]);

  const fetchImages = async () => {
    const { data, error } = await supabase.from('item_images').select('id, image_url, sort_order').eq('item_id', itemId).order('sort_order', { ascending: true });
    if (!error && data) { setImages(data); }
    setLoading(false);
  };

  const processGalleryFile = async (file: File) => {
    if (images.length >= 10) { toast({ title: 'الحد الأقصى', description: 'لا يمكن إضافة أكثر من 10 صور للمنتج الواحد', variant: 'destructive' }); return; }
    const url = await uploadImage(file, userId, `items/${itemId}`);
    if (url) {
      const { error } = await supabase.from('item_images').insert({ item_id: itemId, user_id: userId, image_url: url, sort_order: images.length });
      if (error) { toast({ title: 'خطأ', description: 'فشل في إضافة الصورة', variant: 'destructive' }); await deleteImage(url); }
      else { fetchImages(); toast({ title: 'تم', description: 'تمت إضافة الصورة' }); }
    }
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; await processGalleryFile(file); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const handleNativeGalleryPick = async () => { try { const file = await pickImage(fileInputRef); if (file) await processGalleryFile(file); } catch (err: any) { toast({ title: 'خطأ', description: err.message, variant: 'destructive' }); } };
  
  const handleRemoveImage = async (image: ItemImage) => {
    await deleteImage(image.image_url);
    const { error } = await supabase.from('item_images').delete().eq('id', image.id);
    if (error) { toast({ title: 'خطأ', description: 'فشل في حذف الصورة', variant: 'destructive' }); } else { fetchImages(); }
  };

  if (loading) return <div className="flex items-center justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><Images className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">معرض الصور ({images.length}/10)</span></div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAddImage} />
      <div className="flex flex-wrap gap-2">
        {images.map((image) => (
          <div key={image.id} className="relative group">
            <img src={image.image_url} alt="صورة المنتج" className="w-16 h-16 rounded-lg object-cover border border-border" />
            <Button size="icon" variant="destructive" onClick={() => handleRemoveImage(image)} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></Button>
          </div>
        ))}
        {images.length < 10 && (
          <button onClick={handleNativeGalleryPick} disabled={uploading} className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-colors bg-muted/30">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">أضف صور إضافية للمنتج (حتى 10 صور)</p>
    </div>
  );
};

export default ItemGallery;