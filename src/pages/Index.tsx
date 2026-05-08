import { Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LandingNavbar from '@/components/LandingNavbar';
import { LandingPhoneMockup } from '@/components/LandingPhoneMockup';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  Link2,
  ShoppingBag,
  Zap,
  Lock,
  Headphones,
  X,
  Shield,
  UserPlus,
  ChevronLeft,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-12 pt-2 md:px-6 md:pb-16 md:pt-4">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-4">
          <div className="z-10 order-1 text-right lg:order-none">
            <h1 className="mb-4 text-[1.65rem] font-extrabold leading-snug text-[#0d47a1] sm:text-4xl md:mb-5 md:text-[2.35rem] md:leading-tight lg:text-[2.5rem]">
              أنشئ متجرك وابدأ البيع خلال دقائق
            </h1>
            <p className="mb-6 max-w-xl text-base leading-relaxed text-gray-600 md:mb-8 md:text-lg">
              رابط واحد لمتجرك يطلب منه عملاؤك مباشرة عبر واتساب
            </p>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="primary-gradient h-14 min-h-[3.5rem] w-full rounded-full border-0 px-10 text-base font-bold text-white shadow-[0_12px_30px_-8px_rgba(123,66,246,0.45)] transition-transform hover:scale-[1.02] sm:w-auto sm:text-lg"
              >
                ابدأ متجرك الآن
              </Button>
              <p className="flex items-center justify-end gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4 shrink-0 text-[#7b42f6]" strokeWidth={2} />
                5 دنانير شهرياً - بدون تعقيد
              </p>
            </div>
          </div>

          <div className="order-2 flex justify-center lg:order-none">
            <LandingPhoneMockup />
          </div>
        </div>
      </section>

      {/* Features — inset panel */}
      <section className="px-4 pb-14 md:px-6 md:pb-[4.5rem]">
        <div className="mx-auto max-w-5xl rounded-[1.35rem] bg-[#eceff1] p-4 md:rounded-[1.75rem] md:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
            {[
              {
                icon: <ShoppingBag className="h-7 w-7" strokeWidth={1.75} />,
                title: 'أضف منتجاتك بسهولة',
                desc: 'أضف حتى 40 منتجًا مع الأسعار والصور',
                circle: 'bg-sky-100 text-[#2196f3]',
              },
              {
                icon: <MessageCircle className="h-7 w-7" strokeWidth={1.75} />,
                title: 'استقبال الطلبات',
                desc: 'تواصل مباشر مع عملائك عبر واتساب',
                circle: 'bg-emerald-100 text-[#25D366]',
              },
              {
                icon: <Link2 className="h-7 w-7" strokeWidth={1.75} />,
                title: 'رابط خاص لمتجرك',
                desc: 'رابط جميل وسهل لمتجرك الخاص',
                circle: 'bg-violet-100 text-[#7b42f6]',
              },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 text-right shadow-sm md:p-7">
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${f.circle}`}>{f.icon}</div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-4 py-14 md:px-6 md:py-[4.5rem]">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-extrabold text-[#0d47a1] md:mb-14 md:text-3xl">كيف يعمل؟</h2>
          <div className="flex flex-col items-center gap-10 md:flex-row md:justify-center md:gap-2" dir="rtl">
            {[
              {
                num: 1,
                title: 'سجل برقمك',
                desc: 'أنشئ حسابك بخطوة واحدة برقم جوالك.',
                icon: <UserPlus className="h-7 w-7" strokeWidth={1.75} />,
              },
              {
                num: 2,
                title: 'أضف منتجاتك',
                desc: 'ارفع الصور والأسعار واعرض منتجاتك فوراً.',
                icon: <ShoppingBag className="h-7 w-7" strokeWidth={1.75} />,
              },
              {
                num: 3,
                title: 'شارك الرابط',
                desc: 'أرسل رابط متجرك للعملاء واستقبل الطلبات.',
                icon: <Link2 className="h-7 w-7" strokeWidth={1.75} />,
              },
            ].map((step, idx) => (
              <Fragment key={step.num}>
                <div className="flex w-full max-w-[14.5rem] flex-col items-center gap-2 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-[#7b42f6]">{step.icon}</div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7b42f6] text-sm font-bold text-white shadow-sm">
                    {step.num}
                  </div>
                  <p className="mt-1 text-base font-bold text-gray-900">{step.title}</p>
                  <p className="mx-auto max-w-[12.5rem] text-xs leading-relaxed text-gray-500 md:text-sm">{step.desc}</p>
                </div>
                {idx < 2 ? (
                  <ChevronLeft className="hidden h-7 w-7 shrink-0 text-gray-300 md:block" strokeWidth={2} aria-hidden />
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 pb-14 md:px-6 md:pb-[4.5rem]">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[1.35rem] primary-gradient px-6 py-8 shadow-xl md:rounded-[1.75rem] md:px-10 md:py-10">
            <div dir="ltr" className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between md:gap-10">
              <div dir="rtl" className="flex flex-1 flex-col items-center text-center md:items-start md:text-right">
                <p className="text-sm text-white/90">كل هذا مقابل</p>
                <div className="my-1 flex items-baseline gap-1.5 text-white">
                  <span className="text-6xl font-bold leading-none md:text-7xl">5</span>
                  <span className="text-2xl font-bold md:text-3xl">د.أ</span>
                </div>
                <p className="text-sm text-white/90">شهرياً فقط</p>
              </div>
              <div className="hidden h-[4.5rem] w-px shrink-0 bg-white/50 md:block" aria-hidden />
              <div dir="rtl" className="flex flex-1 flex-col items-center text-center md:items-end md:text-right">
                <Button
                  onClick={() => navigate('/auth')}
                  className="h-12 min-w-[11rem] rounded-full border-0 bg-white px-10 text-base font-bold text-[#7b42f6] shadow-lg hover:bg-gray-50 md:text-lg"
                >
                  ابدأ الآن
                </Button>
                <p className="mt-3 flex items-center justify-end gap-1.5 text-sm text-white/95">
                  <Lock className="h-4 w-4 shrink-0" strokeWidth={2} />
                  آمن وسهل الاستخدام
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-[#f5f5f5] px-4 py-14 md:px-6 md:py-[4.5rem]">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-extrabold text-gray-900 md:mb-12 md:text-3xl">لماذا تختار خدمات؟</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {[
              { icon: <X className="h-9 w-9" strokeWidth={1.5} />, title: 'إلغاء في أي وقت', desc: 'اشتراك مرن بدون التزام طويل.' },
              { icon: <Headphones className="h-9 w-9" strokeWidth={1.5} />, title: 'دعم فني', desc: 'نساعدك عند الحاجة.' },
              { icon: <Shield className="h-9 w-9" strokeWidth={1.5} />, title: 'آمن وموثوق', desc: 'بياناتك محمية.' },
              { icon: <Zap className="h-9 w-9" strokeWidth={1.5} />, title: 'سهل وسريع', desc: 'متجرك جاهز خلال دقائق.' },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-2 px-2 text-center">
                <div className="text-gray-500">{f.icon}</div>
                <h4 className="text-sm font-bold text-gray-900 md:text-base">{f.title}</h4>
                <p className="text-xs leading-relaxed text-gray-500 md:text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#332f39] px-4 py-10 text-white md:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <div className="rounded-xl bg-white/10 px-4 py-2">
            <BrandLogo height={36} />
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <Link to="/terms" className="transition-colors hover:text-white">
              الشروط والأحكام
            </Link>
            <a href="#" className="transition-colors hover:text-white">
              سياسة الخصوصية
            </a>
            <a href="#" className="transition-colors hover:text-white">
              عن خدمات
            </a>
          </div>
          <p className="text-xs text-gray-500">© 2026 خدمات — جميع الحقوق محفوظة</p>
        </div>
      </footer>

      <a
        href="https://wa.me/962799126390"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
        aria-label="تواصل عبر واتساب"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
};

export default Index;
