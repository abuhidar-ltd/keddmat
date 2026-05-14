import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, MessageCircle } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import PhoneInput from '@/components/PhoneInput';
import PasswordResetModal from '@/components/PasswordResetModal';
import { z } from 'zod';

const loginSchema = z.object({
  phone: z.string().min(8, 'رقم الهاتف غير صالح').max(20, 'رقم الهاتف طويل جداً'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const registerSchema = z.object({
  storeName: z.string().min(2, 'اسم المتجر مطلوب'),
  phone: z.string().min(8, 'رقم الهاتف غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  agreeToTerms: z.literal(true, { errorMap: () => ({ message: 'يجب الموافقة على الشروط والأحكام' }) }),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const { isAdmin, adminLoading } = useAdmin();
  const { dir } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const [regData, setRegData] = useState({ storeName: '', phone: '', password: '', agreeToTerms: false });
  const [showRegPwd, setShowRegPwd] = useState(false);

  useEffect(() => {
    if (!user || loading || adminLoading) return;
    navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
  }, [user, loading, adminLoading, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { if (err.path[0]) errs[err.path[0] as string] = err.message; });
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    const { error } = await signIn(loginData.phone, loginData.password);
    setIsSubmitting(false);
    if (error) {
      toast({ title: 'خطأ في تسجيل الدخول', description: 'رقم الهاتف أو كلمة المرور غير صحيحة', variant: 'destructive' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = registerSchema.safeParse(regData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { if (err.path[0]) errs[err.path[0] as string] = err.message; });
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    const { error } = await signUp(regData.phone, regData.password, regData.storeName);
    setIsSubmitting(false);
    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        toast({ title: 'الحساب موجود مسبقاً', description: 'هذا الرقم مسجل بالفعل، يرجى تسجيل الدخول', variant: 'destructive' });
      } else {
        toast({ title: 'خطأ في التسجيل', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'تم التسجيل بنجاح!', description: 'مرحباً بك، يمكنك الآن إضافة منتجاتك' });
    }
  };

  if (loading || (user && adminLoading)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-purple" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-brand-surface" dir={dir}>
      <div className="w-full max-w-md">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-6">
          <BrandLogo height={150} width={150} className="mb-2" />
          <p className="text-base font-semibold text-[#221B2D]">انطلق بمتجرك الإلكتروني اليوم</p>
        </div>
      <Card className="w-full shadow-md rounded-2xl border-0">
        <CardHeader className="sr-only">
          <CardTitle>خدمات</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl">
              <TabsTrigger value="login" className="rounded-xl font-semibold">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register" className="rounded-xl font-semibold">حساب جديد</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-semibold">رقم الهاتف</Label>
                  <PhoneInput value={loginData.phone} onChange={v => setLoginData(p => ({ ...p, phone: v }))} placeholder="7XX XXX XXX" />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">كلمة المرور</Label>
                  <div className="relative">
                    <Input type={showLoginPwd ? 'text' : 'password'} value={loginData.password}
                      onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                      className="h-12 text-base pe-12 rounded-xl border-[rgba(105,61,232,1)]" />
                    <button type="button" onClick={() => setShowLoginPwd(!showLoginPwd)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showLoginPwd ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-bold text-base rounded-xl text-white bg-gradient-to-br from-brand-purple to-brand-cyan hover:opacity-95">
                  {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الدخول...</> : 'تسجيل الدخول'}
                </Button>
                <button type="button" onClick={() => setShowPasswordReset(true)}
                  className="w-full text-sm text-brand-purple hover:underline py-1">
                  نسيت كلمة المرور؟
                </button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-semibold">اسم المتجر <span className="text-red-500">*</span></Label>
                  <Input value={regData.storeName} onChange={e => setRegData(p => ({ ...p, storeName: e.target.value }))}
                    placeholder="مثال: رنا ستورز" className="h-12 text-base rounded-xl" />
                  {errors.storeName && <p className="text-sm text-red-500">{errors.storeName}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">رقم الهاتف <span className="text-red-500">*</span></Label>
                  <PhoneInput value={regData.phone} onChange={v => setRegData(p => ({ ...p, phone: v }))} placeholder="7XX XXX XXX" />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">كلمة المرور <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input type={showRegPwd ? 'text' : 'password'} value={regData.password}
                      onChange={e => setRegData(p => ({ ...p, password: e.target.value }))}
                      className="h-12 text-base pe-12 rounded-xl" />
                    <button type="button" onClick={() => setShowRegPwd(!showRegPwd)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showRegPwd ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                </div>
                {/* Terms */}
                <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${regData.agreeToTerms ? 'bg-brand-purple/5 border-brand-purple/30' : 'bg-white border-[rgba(81,64,227,1)]'}`}>
                  <Checkbox id="agree-terms" checked={regData.agreeToTerms}
                    onCheckedChange={v => setRegData(p => ({ ...p, agreeToTerms: v === true }))}
                    className="mt-0.5 h-5 w-5 cursor-pointer" />
                  <label htmlFor="agree-terms" className="text-sm leading-relaxed text-gray-700 cursor-pointer">
                    أوافق على{' '}
                    <button type="button" onClick={() => setShowTerms(true)} className="text-brand-purple font-bold hover:underline">
                      الشروط والأحكام وسياسة الخصوصية
                    </button>
                  </label>
                </div>
                {errors.agreeToTerms && <p className="text-sm text-red-500">{errors.agreeToTerms}</p>}

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-bold text-base rounded-xl text-white bg-gradient-to-br from-brand-purple to-brand-cyan hover:opacity-95">
                  {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الإنشاء...</> : 'إنشاء الحساب'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 font-extrabold">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-black text-[#221B2D]">أو تواصل عبر</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <a
              href="https://wa.me/962799126390"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="h-5 w-5" />
              تواصل عبر واتساب
            </a>
            <div className="text-center font-semibold">
              <Link to="/" className="text-sm text-[#221B2D] hover:opacity-80 transition-opacity">← العودة للرئيسية</Link>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      <PasswordResetModal open={showPasswordReset} onOpenChange={setShowPasswordReset} />

      {/* Terms Dialog */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" dir={dir}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">الشروط والأحكام</h3>
              <button onClick={() => setShowTerms(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm text-gray-700">
              <p>منصة خدمات تتيح لك إنشاء صفحة متجر بسيطة لعرض منتجاتك ومشاركة رابط واحد، واستقبال استفسارات الطلبات عبر واتساب مع رسالة جاهزة للعميل.</p>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl">
                <p className="font-bold text-yellow-800 mb-1">⚠️ ملاحظة مهمة:</p>
                <p>المنصة وسيط تقني فقط؛ لا تتحمل مسؤولية جودة المنتجات أو التوصيل أو المدفوعات. كل الاتفاقات والتحويلات المالية تتم خارج المنصة وبين المشتري والبائع مباشرة.</p>
              </div>
              <p>بالتسجيل، تؤكد صحة بياناتك وأن نشاطك التجاري ومخزونك وأسعارك ومسؤوليتك القانونية تقع على عاتقك.</p>
            </div>
            <div className="p-4 border-t">
              <Button onClick={() => { setRegData(p => ({ ...p, agreeToTerms: true })); setShowTerms(false); }}
                className="w-full font-bold h-11 rounded-xl text-white bg-gradient-to-br from-brand-purple to-brand-cyan hover:opacity-95">
                ✓ موافق على الشروط والأحكام
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
