import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Store, MessageCircle, Link2, ShoppingBag, Zap, Lock, Headphones, X } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-surface" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-6 pb-14 md:pt-10 md:pb-20 px-4 overflow-hidden">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
          {/* Text Content — always first in DOM = top on mobile, right on desktop */}
          <div className="text-right z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-extrabold text-gray-900 leading-tight mb-4 md:mb-6">
              أنشئ متجرك<br />
              وابدأ البيع<br />
              <span className="text-brand-purple">خلال دقائق</span>
            </h1>
            <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 max-w-md leading-relaxed">
              رابط واحد لمتجرك يطلب منه عملاؤك مباشرة عبر واتساب بكل سهولة واحترافية.
            </p>
            <div className="flex flex-col gap-3 items-start sm:items-end">
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-8 min-h-[52px] rounded-xl font-bold text-white shadow-lg shadow-brand-purple/20 hover:scale-105 transition-transform primary-gradient border-0"
              >
                ابدأ متجرك الآن
              </Button>
              <p className="text-sm text-gray-500">5 دنانير شهرياً — بدون تعقيد</p>
            </div>
          </div>

          {/* Phone Mockup — below text on mobile, left column on desktop */}
          <div className="relative flex justify-center">
            <div className="absolute -top-8 -right-8 w-48 h-48 bg-[#d2bbff]/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-[#e2dfff]/25 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 w-[140px] sm:w-[170px] lg:w-[210px] aspect-[9/18.5] bg-white rounded-[32px] border-[6px] border-gray-800 shadow-2xl overflow-hidden">
              <div className="h-full w-full bg-white flex flex-col text-right">
                <div className="p-2 flex flex-col items-center border-b border-gray-100">
                  <div className="w-8 h-8 bg-[#f3ebfa] rounded-full flex items-center justify-center mb-1">
                    <Store className="h-4 w-4 text-brand-purple" />
                  </div>
                  <h3 className="font-bold text-[10px]">متجر ورد</h3>
                  <p className="text-[8px] text-gray-500">منتجات مميزة</p>
                </div>
                <div className="flex gap-1 p-1.5">
                  <div className="flex-1 bg-[#25D366] text-white text-[8px] py-0.5 rounded-full flex items-center justify-center gap-0.5">
                    <MessageCircle className="h-2 w-2" />
                    <span>واتساب</span>
                  </div>
                  <div className="flex-1 bg-gray-100 text-gray-600 text-[8px] py-0.5 rounded-full flex items-center justify-center border border-gray-200">
                    اتصال
                  </div>
                </div>
                <div className="px-1.5 pb-1.5 space-y-1">
                  {[
                    { name: 'باقة ورد طبيعية', price: '15 JOD' },
                    { name: 'ورد صناعي ديكور', price: '10 JOD' },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-row-reverse gap-1 items-center bg-gray-50 p-1 rounded-lg border border-gray-100">
                      <div className="w-7 h-7 bg-gray-200 rounded flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[7px] font-medium leading-tight">{item.name}</p>
                        <p className="text-[7px] text-brand-purple font-semibold">{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-[#f9f1ff] py-8 px-4">
        <div className="container mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Link2 className="h-7 w-7" />, title: 'رابط خاص لمتجرك', desc: 'رابط جميل وسهل لمتجرك الخاص ليسهل تذكره.', bg: 'bg-[#eaddff] text-brand-purple' },
            { icon: <MessageCircle className="h-7 w-7" />, title: 'استقبال الطلبات', desc: 'تواصل مباشر مع عملائك عبر واتساب وإتمام البيع.', bg: 'bg-[#25D366]/10 text-[#25D366]' },
            { icon: <ShoppingBag className="h-7 w-7" />, title: 'أضف منتجاتك بسهولة', desc: 'أضف منتجاتك مع الأسعار والصور بضغطة زر.', bg: 'bg-[#e2dfff] text-brand-cyan' },
          ].map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm text-right">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${f.bg}`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 md:py-16 px-4 text-center bg-brand-surface">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-extrabold text-brand-purple mb-10">كيف يعمل؟</h2>
          <div className="flex flex-col md:flex-row-reverse items-start justify-between gap-8 relative">
            <div className="hidden md:block absolute top-8 right-[16.67%] left-[16.67%] border-t-2 border-dashed border-brand-purple/20" />
            {[
              { num: 1, title: 'سجل برقمك', desc: 'إنشاء حساب بسيط خلال ثوانٍ معدودة.' },
              { num: 2, title: 'أضف منتجاتك', desc: 'أضف منتجاتك والأسعار وصورة للمنتج.' },
              { num: 3, title: 'شارك الرابط', desc: 'شارك رابط متجرك مع عملائك وابدأ البيع.' },
            ].map((step) => (
              <div key={step.num} className="flex-1 flex flex-col items-center gap-4 z-10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-lg primary-gradient">
                  {step.num}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h4>
                  <p className="text-sm text-gray-600 max-w-[160px] mx-auto">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Banner */}
      <section className="px-4 mb-10 md:mb-16">
        <div className="container mx-auto max-w-5xl rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 primary-gradient">
          <div className="flex items-center gap-6 md:order-1">
            <div className="text-white text-right">
              <p className="text-sm opacity-80">كل هذا مقابل</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl md:text-6xl font-bold">5</span>
                <span className="text-xl md:text-2xl font-bold">د.أ</span>
              </div>
              <p className="text-sm opacity-80">شهرياً فقط</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 md:order-2">
            <Button
              onClick={() => navigate('/auth')}
              className="bg-white text-brand-purple font-bold text-lg px-12 min-h-[48px] rounded-xl hover:bg-gray-50 transition-colors shadow-xl border-0"
            >
              ابدأ الآن
            </Button>
            <p className="text-white/90 text-sm">آمن وسهل الاستخدام</p>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-10 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-extrabold text-center text-gray-900 mb-8">لماذا تختار خدمات؟</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Zap className="h-10 w-10" />, title: 'سهل وسريع', desc: 'ابدأ متجرك خلال دقائق معدودة' },
              { icon: <Lock className="h-10 w-10" />, title: 'آمن وموثوق', desc: 'بياناتك محمية بأعلى معايير الأمان' },
              { icon: <Headphones className="h-10 w-10" />, title: 'دعم فني', desc: 'نحن هنا لمساعدتك في أي وقت' },
              { icon: <X className="h-10 w-10" />, title: 'إلغاء في أي وقت', desc: 'يمكنك إلغاء اشتراكك بسهولة' },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl hover:bg-[#f3ebfa]/40 transition-colors">
                <div className="text-brand-purple">{f.icon}</div>
                <h4 className="text-sm font-bold text-gray-900">{f.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-brand-footer text-white">
        <div className="container mx-auto max-w-5xl flex flex-col items-center text-center gap-6">
          <div className="bg-white/10 rounded-xl px-4 py-2">
            <BrandLogo height={36} />
          </div>
          <div className="flex gap-6 text-sm text-gray-400 flex-wrap justify-center">
            <Link to="/terms" className="hover:text-white transition-colors">الشروط والأحكام</Link>
            <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-white transition-colors">عن خدمات</a>
          </div>
          <p className="text-xs text-gray-500">© 2026 خدمات — جميع الحقوق محفوظة</p>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a
        href="https://wa.me/962799126390"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-40 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        aria-label="تواصل عبر واتساب"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
};

export default Index;
