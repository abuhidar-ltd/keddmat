import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseImageUploadOptions { maxSizeMB?: number; quality?: number; maxWidth?: number; maxHeight?: number; targetMaxKB?: number; }
const TARGET_MAX_KB = 500;
const QUALITY_STEPS = [0.7, 0.5, 0.3];

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
  const { maxSizeMB = 10, maxWidth = 800, maxHeight = 800, targetMaxKB = TARGET_MAX_KB } = options;
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const compressAtQuality = (img: HTMLImageElement, width: number, height: number, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed to compress image')), 'image/webp', quality);
    });
  };

  const compressImage = async (file: File): Promise<Blob> => {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = objectUrl;
      });
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      for (const q of QUALITY_STEPS) {
        const blob = await compressAtQuality(img, width, height, q);
        if (blob.size <= targetMaxKB * 1024) return blob;
        if (q === QUALITY_STEPS[QUALITY_STEPS.length - 1]) return blob;
      }
      return await compressAtQuality(img, width, height, 0.3);
    } finally { URL.revokeObjectURL(objectUrl); }
  };

  const uploadImage = async (file: File, userId: string, folder: string): Promise<string | null> => {
    if (!file) return null;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) { toast({ title: 'نوع ملف غير صالح', description: 'يرجى اختيار صورة بصيغة JPEG, PNG, WebP أو GIF', variant: 'destructive' }); return null; }
    if (file.size > maxSizeMB * 1024 * 1024) { toast({ title: 'الصورة كبيرة جداً', description: `الحد الأقصى لحجم الصورة هو ${maxSizeMB} ميجابايت`, variant: 'destructive' }); return null; }
    setUploading(true);
    try {
      const compressedBlob = await compressImage(file);
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileName = `${userId}/${folder}/${timestamp}-${randomStr}.webp`;
      const { error: uploadError } = await supabase.storage.from('user-uploads').upload(fileName, compressedBlob, { contentType: 'image/webp', upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('user-uploads').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'فشل رفع الصورة', description: error.message || 'حدث خطأ أثناء رفع الصورة', variant: 'destructive' });
      return null;
    } finally { setUploading(false); }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/user-uploads\/(.+)$/);
      if (!pathMatch) return false;
      const filePath = decodeURIComponent(pathMatch[1]);
      const { error } = await supabase.storage.from('user-uploads').remove([filePath]);
      if (error) { console.error('Delete error:', error); return false; }
      return true;
    } catch (error) { console.error('Delete error:', error); return false; }
  };

  return { uploadImage, deleteImage, uploading };
};