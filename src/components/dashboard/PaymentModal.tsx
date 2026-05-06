import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, CheckCircle, XCircle, Clock, FileImage } from 'lucide-react';
import type { PaymentReceipt } from '@/types/keddmat';
import { SUBSCRIPTION_PERIOD_DAYS } from '@/lib/subscription';
import { getCliqAlias } from '@/lib/cliq';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PaymentModal = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) fetchReceipts();
  }, [open, user]);

  const fetchReceipts = async () => {
    const { data } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    setReceipts((data as PaymentReceipt[]) || []);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'الملف كبير جداً', description: 'الحد الأقصى 5 ميجابايت', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    try {
      const fileName = `${user.id}/receipts/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, selectedFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('user-uploads').getPublicUrl(fileName);
      const { error: insertError } = await supabase.from('payment_receipts').insert({
        user_id: user.id,
        receipt_image_url: urlData.publicUrl,
        status: 'pending',
      });
      if (insertError) throw insertError;

      toast({ title: 'تم رفع الوصل', description: 'بعد الموافقة يُمدَّد اشتراكك وفق سياسة الخدمة' });
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchReceipts();
    } catch (err: any) {
      toast({ title: 'فشل رفع الوصل', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="bg-green-500 text-white gap-1"><CheckCircle className="h-3 w-3" />مقبول</Badge>;
    if (status === 'rejected') return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />مرفوض</Badge>;
    return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />قيد المراجعة</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-brand-purple">انشر متجرك</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Instructions */}
          <div className="rounded-xl border border-brand-purple/25 bg-gradient-to-br from-cyan-50 via-violet-50 to-violet-100/80 p-4 space-y-2">
            <p className="font-bold text-brand-purple">تعليمات الدفع</p>
            <p className="text-sm text-gray-700">للنشر، يرجى الدفع عبر CliQ على الحساب:</p>
            <div className="bg-white border border-brand-purple/30 rounded-lg px-4 py-2 text-center">
              <p className="text-lg font-extrabold bg-gradient-to-l from-brand-cyan to-brand-purple bg-clip-text text-transparent tracking-wide">{getCliqAlias()}</p>
            </div>
            <p className="text-xs text-gray-600">
              بعد موافقة الإدارة على الوصل، يُمدَّد اشتراكك <strong>{SUBSCRIPTION_PERIOD_DAYS} يوماً</strong> من تاريخ انتهاء الفترة الحالية (أو من اليوم إن كانت منتهية).
              إن كان اشتراكك لا يزال سارياً، يُضاف الشهر فوق المدة الباقية.
            </p>
            <p className="text-xs text-gray-600">بعد الدفع، ارفع صورة الوصل وانتظر الموافقة.</p>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <label className="block font-semibold text-gray-700">صورة وصل الدفع</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
            />
            {previewUrl && (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="max-h-40 rounded-xl border object-contain mx-auto" />
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  className="absolute top-2 left-2 bg-white rounded-full p-1 shadow hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 text-red-500" />
                </button>
              </div>
            )}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full font-bold text-white bg-gradient-to-br from-brand-cyan to-brand-purple hover:opacity-95"
            >
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الرفع...</> : <><Upload className="h-4 w-4 ml-2" />إرسال الوصل</>}
            </Button>
          </div>

          {/* Receipt history */}
          {!loading && receipts.length > 0 && (
            <div className="space-y-3">
              <p className="font-semibold text-gray-700">سجل الوصولات</p>
              {receipts.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 border rounded-xl">
                  <img src={r.receipt_image_url} alt="receipt" className="w-14 h-14 rounded-lg object-cover border shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                  {statusBadge(r.status)}
                </div>
              ))}
            </div>
          )}

          {!loading && receipts.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <FileImage className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">لم ترفع أي وصولات بعد</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
