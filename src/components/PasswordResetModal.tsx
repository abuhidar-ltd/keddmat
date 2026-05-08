import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import PhoneInput from '@/components/PhoneInput';
import { supabase } from '@/integrations/supabase/client';

interface PasswordResetModalProps { open: boolean; onOpenChange: (open: boolean) => void; }

const PasswordResetModal = ({ open, onOpenChange }: PasswordResetModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const cleanPhone = phone.replace(/[^0-9]/g, '');

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep(1);
      setPhone('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      setError('');
      setDone(false);
    }
    onOpenChange(isOpen);
  };

  const sendOtp = async () => {
    setError('');
    setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke('send-otp', {
      body: { phone: cleanPhone, purpose: 'password_reset' },
    });
    setLoading(false);
    if (fnError || data?.error) {
      const code = data?.error;
      setError(code === 'PHONE_NOT_FOUND' ? 'لا يوجد حساب مرتبط بهذا الرقم' : 'حدث خطأ، يرجى المحاولة مجدداً');
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (cleanPhone.length < 8) { setError('أدخل رقم هاتف صالح'); return; }
    const ok = await sendOtp();
    if (ok) setStep(2);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setError('أدخل رمز التحقق المكوّن من 6 أرقام'); return; }
    setError('');
    setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke('verify-otp', {
      body: { phone: cleanPhone, otp, purpose: 'password_reset' },
    });
    setLoading(false);
    if (fnError || !data?.success) {
      setError('رمز خاطئ أو منتهي الصلاحية');
      return;
    }
    setResetToken(data.resetToken);
    setStep(3);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (newPassword !== confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return; }
    setError('');
    setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke('reset-password', {
      body: { phone: cleanPhone, resetToken, newPassword, purpose: 'password_reset' },
    });
    setLoading(false);
    if (fnError || !data?.success) {
      setError('فشل تغيير كلمة المرور، يرجى المحاولة من البداية');
      return;
    }
    setDone(true);
    setTimeout(() => handleClose(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">إعادة تعيين كلمة المرور</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-center font-semibold text-green-700">تم تغيير كلمة المرور بنجاح ✓</p>
          </div>
        ) : (
          <div className="space-y-5 py-2">

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              {([1, 2, 3] as const).map(s => (
                <span key={s} className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step === s ? 'bg-brand-purple text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>{s}</span>
              ))}
            </div>

            {/* Step 1: Phone */}
            {step === 1 && (
              <>
                <p className="text-center text-gray-500 text-sm">أدخل رقم هاتفك لإرسال رمز التحقق عبر واتساب</p>
                <div className="space-y-2">
                  <Label className="font-semibold">رقم الهاتف</Label>
                  <PhoneInput value={phone} onChange={setPhone} placeholder="7XX XXX XXX" />
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button onClick={handleSendOtp} disabled={loading} className="w-full h-12 font-bold text-white bg-gradient-to-br from-brand-purple to-brand-cyan rounded-xl">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الإرسال...</> : 'إرسال رمز التحقق'}
                </Button>
              </>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
              <>
                <p className="text-center text-gray-500 text-sm">أدخل الرمز المكوّن من 6 أرقام الذي أُرسل إلى واتساب</p>
                <div className="space-y-2">
                  <Label className="font-semibold">رمز التحقق</Label>
                  <Input
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    className="h-12 text-center text-2xl tracking-widest rounded-xl"
                    inputMode="numeric"
                  />
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button onClick={handleVerifyOtp} disabled={loading} className="w-full h-12 font-bold text-white bg-gradient-to-br from-brand-purple to-brand-cyan rounded-xl">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري التحقق...</> : 'تحقق من الرمز'}
                </Button>
                <button
                  type="button"
                  onClick={async () => { setError(''); setOtp(''); await sendOtp(); }}
                  disabled={loading}
                  className="w-full text-sm text-brand-purple hover:underline py-1"
                >
                  إعادة إرسال الرمز
                </button>
              </>
            )}

            {/* Step 3: New password */}
            {step === 3 && (
              <>
                <p className="text-center text-gray-500 text-sm">أدخل كلمة المرور الجديدة</p>
                <div className="space-y-2">
                  <Label className="font-semibold">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="h-12 text-base pe-12 rounded-xl"
                    />
                    <button type="button" onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showNewPwd ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="h-12 text-base pe-12 rounded-xl"
                    />
                    <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showConfirmPwd ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button onClick={handleResetPassword} disabled={loading} className="w-full h-12 font-bold text-white bg-gradient-to-br from-brand-purple to-brand-cyan rounded-xl">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الحفظ...</> : 'تغيير كلمة المرور'}
                </Button>
              </>
            )}

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetModal;
