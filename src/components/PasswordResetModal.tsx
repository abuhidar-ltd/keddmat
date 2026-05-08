import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import PhoneInput from '@/components/PhoneInput';

interface PasswordResetModalProps { open: boolean; onOpenChange: (open: boolean) => void; }

const PasswordResetModal = ({ open, onOpenChange }: PasswordResetModalProps) => {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setPhone('');
      setSent(false);
      setError('');
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8) {
      setError('أدخل رقم هاتف صالح');
      return;
    }
    const text = encodeURIComponent(`أريد إعادة تعيين كلمة المرور لرقم الهاتف ${cleanPhone}`);
    window.open(`https://wa.me/962799126390?text=${text}`, '_blank');
    setSent(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">إعادة تعيين كلمة المرور</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <MessageCircle className="h-12 w-12 text-[#25D366]" />
              <p className="font-semibold text-gray-800">تم فتح واتساب — أرسل الرسالة وسنتواصل معك لإعادة تعيين كلمة المرور</p>
            </div>
          ) : (
            <>
              <p className="text-center text-gray-500 text-sm">أدخل رقم هاتفك وسنتواصل معك عبر واتساب</p>
              <div className="space-y-2">
                <PhoneInput value={phone} onChange={setPhone} placeholder="7XX XXX XXX" />
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              </div>
              <Button
                onClick={handleSubmit}
                className="w-full h-12 font-bold text-white bg-[#25D366] hover:bg-[#1ebe5d] rounded-xl flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                تواصل عبر واتساب
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetModal;
