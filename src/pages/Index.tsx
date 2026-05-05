import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Store, Share2, MessageCircle, BarChart2, ChevronLeft, ArrowLeft } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#F7FAF8] py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-snug mb-6">
            متجرك الخاص<br />
            <span
              className="inline-block bg-clip-text text-transparent pb-1 leading-normal [-webkit-background-clip:text]"
              style={{ backgroundImage: 'linear-gradient(135deg, #2D7D46, #00BCD4)' }}
            >
              في ثوانٍ
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            أنشئ متجرك، أضف منتجاتك، شارك الرابط واستقبل الطلبات عبر واتساب مباشرة
          </p>
          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            className="text-lg px-8 py-6 rounded-2xl font-bold shadow-lg hover:-translate-y-1 transition-transform"
            style={{ background: 'linear-gradient(135deg, #2D7D46, #00BCD4)' }}
          >
            ابدأ مجاناً
            <ChevronLeft className="h-5 w-5 mr-2" />
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">كيف يعمل؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '١', title: 'أنشئ متجرك', desc: 'سجّل حسابك وأضف اسم متجرك وصورتك ورقم واتساب في دقيقة واحدة' },
              { num: '٢', title: 'أضف منتجاتك', desc: 'أضف صور منتجاتك مع الأسعار وخيارات التوصيل بسهولة تامة' },
              { num: '٣', title: 'شارك وبيع', desc: 'شارك رابط متجرك في أي مكان واستقبل الطلبات مباشرة على واتساب' },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-extrabold text-white shadow-md transition-transform group-hover:-translate-y-1"
                  style={{ background: 'linear-gradient(135deg, #2D7D46, #00BCD4)' }}
                >
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-700 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-[#F7FAF8]">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">لماذا خدمات؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: <Store className="h-7 w-7" />, title: 'متجر احترافي خاص بك', desc: 'صفحة متجر جميلة بصورة غلاف ولوجو وقائمة منتجات منظمة' },
              { icon: <Share2 className="h-7 w-7" />, title: 'شارك برابط واحد', desc: 'رابط بسيط تشاركه على تيك توك، إنستغرام، أو أي مكان آخر' },
              { icon: <MessageCircle className="h-7 w-7" />, title: 'طلبات واتساب مباشرة', desc: 'يضغط العميل على المنتج ويُفتح واتساب مع رسالة جاهزة بالاسم والسعر' },
              { icon: <BarChart2 className="h-7 w-7" />, title: 'إحصائيات مباشرة', desc: 'تعرّف كم شخصاً زار متجرك وكم طلباً واتساب استقبلت يومياً' },
            ].map((f, i) => (
              <Card key={i} className="rounded-2xl shadow-md border-0 hover:-translate-y-1 transition-transform duration-300 bg-white">
                <CardContent className="p-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4"
                    style={{ background: 'linear-gradient(135deg, #2D7D46, #00BCD4)' }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #2D7D46, #00BCD4)' }}>
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">انشر متجرك اليوم</h2>
          <p className="text-white/80 text-lg mb-8">انضم لمئات البائعين الذين يستقبلون طلباتهم عبر واتساب</p>
          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            className="bg-white text-[#2D7D46] hover:bg-white/90 font-extrabold text-lg px-10 py-6 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform"
          >
            ابدأ الآن
            <ArrowLeft className="h-5 w-5 mr-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4" style={{ backgroundColor: '#1A3C4E' }}>
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2D7D46, #00BCD4)' }}>
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-lg">خدمات</p>
              <p className="text-white/60 text-xs">ابنِ متجرك الإلكتروني</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/962799126390"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#20BD5A] transition-colors text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              دعم واتساب
            </a>
            <Link to="/terms" className="text-white/60 text-sm hover:text-white transition-colors">الشروط والأحكام</Link>
          </div>
        </div>
        <p className="text-center text-white/40 text-xs mt-6">© 2026 خدمات — جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
};

export default Index;
