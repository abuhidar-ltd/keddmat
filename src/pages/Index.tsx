import { useNavigate, Link } from 'react-router-dom';
import LandingNavbar from '@/components/LandingNavbar';
import { LandingPhoneMockup } from '@/components/LandingPhoneMockup';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  Link2,
  ShoppingBag,
  Zap,
  X,
  UserPlus,
  LayoutDashboard,
  Star,
  Store,
  User,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useLanguage } from '@/hooks/useLanguage';

const Index = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();

  return (
    <div className="min-h-screen bg-white" dir={dir}>
      <LandingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-2 pb-6 pt-1 sm:px-4 md:px-6 md:pb-8 md:pt-4">
        <div
          className="mx-auto flex max-w-6xl flex-row items-start gap-2 sm:gap-4 md:gap-6 lg:gap-8"
          dir="ltr"
        >
          <LandingPhoneMockup />
          <div className="z-10 min-w-0 flex-1 text-right" dir="rtl">
            <h1 className="mb-2 text-[22px] font-extrabold leading-snug text-[#0d47a1] sm:mb-4 sm:text-[2rem] md:mb-5 md:text-[2.55rem] md:leading-tight lg:text-[2.7rem]">
              أنشئ متجرك الإلكتروني خلال دقائق
            </h1>
            <p className="mb-3 max-w-xl text-sm leading-relaxed text-gray-700 sm:mb-6 sm:text-lg md:mb-8 md:text-xl">
              و احصل على رابط متجرك و ابدا البيع
            </p>
            <div className="flex flex-col items-stretch gap-2 sm:items-end sm:gap-3">
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="primary-gradient h-10 min-h-10 w-full rounded-full border-0 px-3 text-[0.7rem] font-bold text-white shadow-[0_12px_30px_-8px_rgba(123,66,246,0.45)] transition-transform hover:scale-[1.02] sm:h-14 sm:min-h-[3.5rem] sm:px-10 sm:text-base md:text-lg"
              >
                انشى متجرك الان مجانا
              </Button>
              <ul className="mt-2 flex w-full max-w-xl flex-col gap-1.5 text-right sm:mt-3 sm:self-end sm:gap-2">
                {[
                  'بدون خبرة',
                  'خلال دقايق',
                  'متجر مربوط مباشرة بالواتساب',
                  'سلة مشتريات لكل متجر',
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-baseline justify-start gap-2 text-xs font-medium leading-snug text-gray-700 sm:text-sm"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0d47a1] sm:h-2 sm:w-2"
                      aria-hidden
                    />
                    <span className="min-w-0">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-[#f5f5f5] px-4 pb-10 pt-6 md:px-6 md:pb-12 md:pt-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-5 text-center text-lg font-extrabold text-[#0D47A1] md:mb-7 md:text-3xl">لماذا تختار خدمات؟</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4 md:gap-x-4 md:gap-y-5">
            {[
              { icon: <Zap className="h-8 w-8" strokeWidth={1.5} />, title: 'سهل وسريع', desc: 'متجرك جاهز خلال دقائق.' },
              { icon: <User className="h-8 w-8" strokeWidth={1.5} />, title: '300+ يثقون بنا', desc: 'من التجّار والعملاء على المنصة.' },
              { icon: <Store className="h-8 w-8" strokeWidth={1.5} />, title: '300 متجر +', desc: 'متاجر نشطة على المنصة.' },
              { icon: <X className="h-8 w-8" strokeWidth={1.5} />, title: 'إلغاء في أي وقت', desc: 'اشتراك مرن بدون التزام طويل.' },
            ].map((f, i) => (
              <div key={f.title} className="flex flex-col items-center gap-1 px-1 text-center md:gap-1.5 md:px-1.5">
                <div className="text-[#0D47A1]">{f.icon}</div>
                <h4 className="text-sm font-bold text-gray-900 md:text-base">{f.title}</h4>
                <p className="text-xs leading-relaxed text-gray-600 md:text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration steps — same card grid as «لماذا تختار خدمات؟» */}
      <section className="border-t border-gray-100/80 bg-white px-4 pb-14 pt-8 md:px-6 md:pb-16 md:pt-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-5 text-center text-lg font-extrabold text-[#0D47A1] md:mb-7 md:text-3xl">طريقه التسجيل</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-3 md:gap-x-4 md:gap-y-5 lg:grid-cols-6">
            {[
              {
                title: 'سجل برقمك',
                desc: 'أنشئ حسابك بخطوة واحدة برقم جوالك.',
                icon: <UserPlus className="h-8 w-8" strokeWidth={1.5} />,
              },
              {
                title: 'أضف منتجاتك',
                desc: 'ارفع الصور والأسعار واعرض منتجاتك فوراً.',
                icon: <ShoppingBag className="h-8 w-8" strokeWidth={1.5} />,
              },
              {
                title: 'شارك الرابط',
                desc: 'أرسل رابط متجرك للعملاء واستقبل الطلبات.',
                icon: <Link2 className="h-8 w-8" strokeWidth={1.5} />,
              },
              {
                title: 'لوحه تحكم خاصه بك',
                desc: 'حدّث منتجاتك وتابع طلباتك في أي وقت.',
                icon: <LayoutDashboard className="h-8 w-8" strokeWidth={1.5} />,
              },
              {
                title: 'طلبات عبر واتساب',
                desc: 'يصلك طلب العميل مباشرة على رقم واتساب متجرك.',
                icon: <MessageCircle className="h-8 w-8" strokeWidth={1.5} />,
              },
              {
                title: 'تقييمات العملاء',
                desc: 'متجرك يدعم التقييمات لتعزيز ثقة الزبائن.',
                icon: <Star className="h-8 w-8" strokeWidth={1.5} />,
              },
            ].map((step) => (
              <div key={step.title} className="flex flex-col items-center gap-1 px-1 text-center md:gap-1.5 md:px-1.5">
                <div className="text-[#0D47A1]">{step.icon}</div>
                <h4 className="text-sm font-bold text-gray-900 md:text-base">{step.title}</h4>
                <p className="text-xs leading-relaxed text-gray-600 md:text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white px-4 pb-12 pt-8 md:px-6 md:pb-16 md:pt-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-lg font-extrabold text-[#0D47A1] md:text-3xl">الأسعار</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Free tier */}
            <div className="rounded-2xl border border-gray-200 bg-[#f5f5f5] p-6">
              <p className="mb-1 text-sm font-semibold text-gray-500">مجاني</p>
              <p className="mb-5 text-3xl font-extrabold text-gray-900">مجاني للأبد</p>
              <ul className="mb-6 space-y-2 text-sm text-gray-700">
                {['متجر نشط ومرئي للعملاء', '2 منتجات', 'طلبات عبر واتساب', 'سلة مشتريات'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />{f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate('/auth')} variant="outline" className="w-full rounded-full font-bold">
                ابدأ مجاناً
              </Button>
            </div>
            {/* Pro tier */}
            <div className="rounded-2xl border-2 border-[#7B2CBF] bg-white p-6 shadow-lg">
              <p className="mb-1 text-sm font-semibold text-[#7B2CBF]">الأكثر شيوعاً</p>
              <p className="mb-5 text-3xl font-extrabold text-gray-900">
                5 د.أ <span className="text-base font-normal text-gray-500">/ شهر</span>
              </p>
              <ul className="mb-6 space-y-2 text-sm text-gray-700">
                {['100 منتج', 'إحصائيات كاملة', 'شارة التحقق ✓', 'طلبات عبر واتساب', 'سلة مشتريات'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#7B2CBF]" />{f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate('/auth')} className="w-full rounded-full font-bold text-white primary-gradient border-0">
                ابدأ الآن
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#332f39] px-4 py-12 text-white md:px-6 md:py-14">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <div className="rounded-xl bg-white/10 px-4 py-2">
            <BrandLogo height={36} />
          </div>
          <Link
            to="/terms"
            className="max-w-[min(100%,20rem)] text-center text-xs leading-snug text-gray-400 transition-colors hover:text-white sm:text-sm"
          >
            الشروط و الاحكام و سياسه الخصوصيه
          </Link>
          <p className="text-xs text-gray-500">© 2026 خدمات — جميع الحقوق محفوظة</p>
        </div>
      </footer>

      <a
        href="https://wa.me/962799126390"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 left-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition-transform hover:scale-105"
        aria-label="تواصل عبر واتساب"
      >
        <MessageCircle className="h-5 w-5" strokeWidth={2} />
      </a>
    </div>
  );
};

export default Index;
