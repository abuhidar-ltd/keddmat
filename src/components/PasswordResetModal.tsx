import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PhoneInput from '@/components/PhoneInput';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Eye, EyeOff, Phone, KeyRound, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Store, ShoppingBag } from 'lucide-react';

type Step = 'phone' | 'otp' | 'password' | 'success';
type UserType = 'customer' | 'merchant';

interface PasswordResetModalProps { open: boolean; onOpenChange: (open: boolean) => void; }

const PasswordResetModal = ({ open, onOpenChange }: PasswordResetModalProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const isRTL = language === 'ar';
  
  const [step, setStep] = useState<Step>('phone');
  const [userType, setUserType] = useState<UserType>('customer');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    setError('');
    if (!phone || phone.length < 8) { setError(t('auth.phoneInvalid')); return; }
    setIsLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('send-otp', { body: { phone, userType } });
      if (invokeError) throw new Error(invokeError.message);
      if (data?.error) { setError(data.code === 'PHONE_NOT_FOUND' ? t('auth.phoneNotFound') : data.code === 'RATE_LIMITED' ? t('auth.rateLimited') : data.error); return; }
      toast({ title: t('auth.otpSent'), description: t('auth.checkWhatsApp') });
      setStep('otp'); setCountdown(60);
    } catch (err) { console.error('Send OTP error:', err); setError(t('auth.sendOtpFailed')); }
    finally { setIsLoading(false); }
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (otp.length !== 6) { setError(t('auth.invalidOtp')); return; }
    setIsLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('verify-otp', { body: { phone, userType, otp } });
      if (invokeError) throw new Error(invokeError.message);
      if (data?.error) { setError(data.code === 'WRONG_OTP' ? t('auth.invalidOtp') : (data.code === 'NO_VALID_OTP' || data.code === 'MAX_ATTEMPTS') ? t('auth.otpExpired') : data.error); return; }

      const token = data?.resetToken ?? data?.tempPassword;
      if (!token) { setError(t('auth.verifyOtpFailed')); return; }

      setResetToken(token);
      setStep('password');
    } catch (err) { console.error('Verify OTP error:', err); setError(t('auth.verifyOtpFailed')); }
    finally { setIsLoading(false); }
  };

  const handleResetPassword = async () => {
    setError('');
    if (newPassword.length < 6) { setError(t('auth.passwordMin')); return; }
    if (newPassword !== confirmPassword) { setError(t('auth.passwordMismatch')); return; }
    setIsLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('reset-password', { body: { resetToken, newPassword, userType, phone } });
      if (invokeError) throw new Error(invokeError.message);
      if (data?.error) { setError(data.code === 'INVALID_TOKEN' ? t('auth.tokenExpired') : data.error); return; }
      setStep('success');
    } catch (err) { console.error('Reset password error:', err); setError(t('auth.resetPasswordFailed')); }
    finally { setIsLoading(false); }
  };

  const handleResendOTP = () => { setOtp(''); handleSendOTP(); };
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-center text-xl">{step === 'success' ? t('auth.passwordChanged') : t('auth.resetPassword')}</DialogTitle></DialogHeader>
        <div className="space-y-6 py-4">
          {step === 'phone' && (
            <div className="space-y-5">
              <div className="flex justify-center"><div className="p-4 rounded-full bg-primary/10"><Phone className="h-8 w-8 text-primary" /></div></div>
              <p className="text-center text-muted-foreground">{t('auth.enterPhoneReset')}</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setUserType('customer')} className={`p-3 rounded-xl border-2 transition-all ${userType === 'customer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}><ShoppingBag className={`h-6 w-6 mx-auto mb-1 ${userType === 'customer' ? 'text-primary' : 'text-muted-foreground'}`} /><p className={`text-sm font-semibold ${userType === 'customer' ? 'text-primary' : ''}`}>{t('auth.customer')}</p></button>
                <button type="button" onClick={() => setUserType('merchant')} className={`p-3 rounded-xl border-2 transition-all ${userType === 'merchant' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}><Store className={`h-6 w-6 mx-auto mb-1 ${userType === 'merchant' ? 'text-primary' : 'text-muted-foreground'}`} /><p className={`text-sm font-semibold ${userType === 'merchant' ? 'text-primary' : ''}`}>{t('auth.merchant')}</p></button>
              </div>
              <div className="space-y-2"><Label>{t('auth.phone')}</Label><PhoneInput placeholder="7XX XXX XXX" value={phone} onChange={setPhone} /></div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button onClick={handleSendOTP} className="w-full h-12" disabled={isLoading}>{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.sendCode')}</Button>
            </div>
          )}
          {step === 'otp' && (
            <div className="space-y-5">
              <div className="flex justify-center"><div className="p-4 rounded-full bg-primary/10"><KeyRound className="h-8 w-8 text-primary" /></div></div>
              <div className="text-center space-y-1"><p className="text-muted-foreground">{t('auth.enterOtp')}</p><p className="text-sm text-muted-foreground">{t('auth.codeSentTo')}: <span className="font-semibold" dir="ltr">{phone}</span></p><p className="text-xs text-muted-foreground">⏱️ {t('auth.validFor')}</p></div>
              <div className="flex justify-center" dir="ltr"><InputOTP value={otp} onChange={setOtp} maxLength={6}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup></InputOTP></div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button onClick={handleVerifyOTP} className="w-full h-12" disabled={isLoading || otp.length !== 6}>{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.verify')}</Button>
              <div className="text-center">{countdown > 0 ? <p className="text-sm text-muted-foreground">{t('auth.resendIn')} {countdown}s</p> : <button onClick={handleResendOTP} className="text-sm text-primary hover:underline" disabled={isLoading}>{t('auth.resendCode')}</button>}</div>
              <button onClick={() => setStep('phone')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto"><BackArrow className="h-4 w-4" />{t('auth.changePhone')}</button>
            </div>
          )}
          {step === 'password' && (
            <div className="space-y-5">
              <div className="flex justify-center"><div className="p-4 rounded-full bg-primary/10"><KeyRound className="h-8 w-8 text-primary" /></div></div>
              <p className="text-center text-muted-foreground">{t('auth.enterNewPassword')}</p>
              <div className="space-y-4">
                <div className="space-y-2"><Label>{t('auth.newPassword')}</Label><div className="relative"><Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 pe-12" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
                <div className="space-y-2"><Label>{t('auth.confirmPassword')}</Label><div className="relative"><Input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 pe-12" /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button onClick={handleResetPassword} className="w-full h-12" disabled={isLoading}>{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.changePassword')}</Button>
            </div>
          )}
          {step === 'success' && (
            <div className="space-y-5 text-center">
              <div className="flex justify-center"><div className="p-4 rounded-full bg-success/10"><CheckCircle2 className="h-12 w-12 text-success" /></div></div>
              <div className="space-y-2"><p className="text-lg font-semibold text-success">{t('auth.passwordChanged')}</p><p className="text-muted-foreground">{t('auth.canLoginNow')}</p></div>
              <Button onClick={() => onOpenChange(false)} className="w-full h-12">{t('auth.login')}</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetModal;