import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageCircle } from 'lucide-react';
import PhoneInput from '@/components/PhoneInput';

interface PasswordResetModalProps { open: boolean; onOpenChange: (open: boolean) => void; }

const SUPPORT_WHATSAPP = '962799126390';

const PasswordResetModal = ({ open, onOpenChange }: PasswordResetModalProps) => {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!phone || phone.length < 7) return;
    const encoded = encodeURIComponent(phone);
    const text = encodeURIComponent(`مرحباً، أريد إعادة تعيين كلمة المرور لحسابي برقم الهاتف ${phone}`);
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`, '_blank');
    setSent(true);
  };

  const handleClose = (open: boolean) => {
    if (!open) { setPhone(''); setSent(false); }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">إعادة تعيين كلمة المرور</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-green-100">
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm">أدخل رقم هاتفك وسنتواصل معك عبر واتساب لإعادة تعيين كلمة المرور.</p>
          <div className="space-y-2">
            <Label className="font-semibold">رقم الهاتف</Label>
            <PhoneInput value={phone} onChange={setPhone} placeholder="7XX XXX XXX" />
          </div>
          <Button
            onClick={handleSend}
            disabled={phone.length < 7}
            className="w-full h-12 font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            تواصل عبر واتساب
          </Button>
          {sent && (
            <p className="text-center text-sm text-green-700 font-medium bg-green-50 rounded-xl p-3">
              سيتم التواصل معك عبر واتساب لإعادة تعيين كلمة المرور
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetModal;
