import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/hooks/useLanguage';
import { ArrowRight, ArrowLeft, Shield, Users, FileCheck, UserCheck, Ban, Info, Scale, CreditCard, AlertTriangle, Gift } from 'lucide-react';

const Terms = () => {
  const { language, t, dir } = useLanguage();
  const navigate = useNavigate();
  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-[#EFF3F8]" dir={dir}>
      <header className="bg-white border-b border-[#E5E7EB] shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-extrabold text-[#165B91]">{t('terms.khadamat')}</Link>
          <Button variant="outline" asChild className="border-[#165B91] text-[#165B91] hover:bg-[#165B91]/5">
            <Link to="/auth" className="flex items-center gap-2">
              <ArrowIcon className="w-4 h-4" />
              {t('terms.back')}
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-[#1A1A2E] mb-3">
            {t('terms.title')}
          </h1>
          <p className="text-[#6B7280]">{t('terms.readCarefully')}</p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-[#165B91] mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('terms.privacyPolicy')}
            </h2>
            <Card className="border-[#165B91]/20 rounded-2xl shadow-sm mb-3">
              <CardContent className="pt-6 space-y-4 text-[#1A1A2E] leading-relaxed">
                <p>{isAr ? 'نحن في منصة خدمات نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.' : 'At Khadamat, we respect your privacy and are committed to protecting your personal data.'}</p>
                <div>
                  <h3 className="font-bold mb-2">{isAr ? 'جمع المعلومات:' : 'Information Collection:'}</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>{isAr ? 'نقوم بجمع البيانات التي تقدمها عند إنشاء حساب التاجر (مثل اسم المتجر ورقم واتساب وبيانات تسجيل الدخول).' : 'We collect data you provide when creating a merchant account (such as store name, WhatsApp number, and login details).'}</li>
                    <li>{isAr ? 'نقوم بجمع معلومات استخدام بسيطة (مثل زيارات صفحة المتجر) لعرض إحصائيات لك ولتحسين الخدمة.' : 'We collect basic usage information (such as store page visits) to show you statistics and improve the service.'}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2">{isAr ? 'استخدام المعلومات:' : 'Use of Information:'}</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>{isAr ? 'تُستخدم البيانات لتشغيل صفحة متجرك، عرض منتجاتك، وتوليد روابط واتساب للطلبات.' : 'Data is used to run your store page, display your products, and generate WhatsApp links for orders.'}</li>
                    <li>{isAr ? 'لا نبيع بياناتك الشخصية. لا نشاركها مع أطراف ثالثة إلا إذا اُلزمنا بذلك قانوناً.' : 'We do not sell your personal data. We do not share it with third parties except where required by law.'}</li>
                  </ul>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h3 className="font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /> {isAr ? 'ملاحظات مهمة:' : 'Important Notes:'}</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>{isAr ? 'المنصة وسيط تقني فقط بين البائع والمشتري؛ لا تضمن جودة المنتجات أو التسليم.' : 'The platform is only a technical intermediary between seller and buyer; it does not guarantee product quality or delivery.'}</li>
                    <li>{isAr ? 'أي دفعة أو اتفاق تجاري يتم خارج المنصة وبين الطرفين مباشرة.' : 'Any payment or commercial agreement is made outside the platform, directly between the parties.'}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#165B91] mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5" />
              {t('terms.disclaimer')}
            </h2>
            <div className="space-y-3">
              <Card className="border-[#165B91]/20 rounded-2xl shadow-sm">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-[#165B91]/10 shrink-0 mt-1"><Users className="w-5 h-5 text-[#165B91]" /></div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A2E]">{isAr ? '1. منصة وسيطة فقط:' : '1. Intermediary platform only:'}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{isAr ? 'منصة خدمات توفّر أدوات لإنشاء صفحة متجر إلكترونية بسيطة وربط الزوار بطلبات واتساب. نحن لا نشغّل متجرك نيابة عنك ولا نستلم الطلبات نيابة عنك.' : 'Khadamat provides tools to create a simple online store page and connect visitors to WhatsApp orders. We do not operate your store on your behalf or receive orders for you.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#165B91]/20 rounded-2xl shadow-sm">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-[#165B91]/10 shrink-0 mt-1"><FileCheck className="w-5 h-5 text-[#165B91]" /></div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A2E]">{isAr ? '2. عدم المسؤولية عن المنتجات والمحتوى:' : '2. No liability for products or content:'}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{isAr ? 'أنت المسؤول الوحيد عن صور المنتجات والأسعار والتوصيف والتوافر وأي وعود تقدّمها في متجرك. المنصة لا تتحقق من صحة الإعلانات ولا من مطابقة المنتج للواقع.' : 'You are solely responsible for product images, prices, descriptions, availability, and any claims you make on your store. The platform does not verify listings or whether products match their description.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#165B91]/20 rounded-2xl shadow-sm">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-[#165B91]/10 shrink-0 mt-1"><CreditCard className="w-5 h-5 text-[#165B91]" /></div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A2E]">{isAr ? '3. عدم المسؤولية عن المدفوعات:' : '3. No Liability for Payments:'}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{isAr ? 'أي معاملات مالية تتم مباشرة بين الطرفين.' : 'Any financial transactions are conducted directly between the two parties.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#165B91]/20 rounded-2xl shadow-sm">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-[#165B91]/10 shrink-0 mt-1"><UserCheck className="w-5 h-5 text-[#165B91]" /></div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A2E]">{isAr ? '4. النزاعات:' : '4. Disputes:'}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{isAr ? 'المنصة ليست طرفاً في أي نزاع بين المشتري والبائع بخصوص منتج أو دفع أو توصيل.' : 'The platform is not a party to any dispute between buyer and seller regarding a product, payment, or delivery.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#165B91]/20 rounded-2xl shadow-sm">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-[#165B91]/10 shrink-0 mt-1"><Ban className="w-5 h-5 text-[#165B91]" /></div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A2E]">{isAr ? '5. التعديلات:' : '5. Modifications:'}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{isAr ? 'تحتفظ المنصة بحق تعديل هذه السياسات في أي وقت.' : 'The platform reserves the right to modify these policies at any time.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#165B91]/20 rounded-2xl shadow-sm">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-[#165B91]/10 shrink-0 mt-1"><Shield className="w-5 h-5 text-[#165B91]" /></div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A2E]">{isAr ? '6. التراخيص والموافقات الرسمية:' : '6. Licenses and Official Approvals:'}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{isAr ? 'يتحمّل كل تاجر مسؤولية كاملة عن الالتزام بالقوانين المعمول بها في نشاطه (بما في ذلك التراخيص التجارية والضرائب والمنتجات المنظّمة أو المقيدة)، وعن دقة المحتوى الذي ينشره في متجره. لا تتحمل المنصة أي مسؤولية قانونية عن ذلك.' : 'Each merchant bears full responsibility for complying with laws applicable to their activity (including business licenses, taxes, and regulated or restricted products), and for the accuracy of content they publish on their store. The platform bears no legal liability for this.'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#165B91] mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5" />
              {isAr ? 'استخدام المنصة والباقات' : 'Using the platform & plans'}
            </h2>
            <Card className="border-[#165B91]/20 rounded-2xl shadow-sm">
              <CardContent className="pt-6 text-[#1A1A2E] leading-relaxed">
                <p>
                  {isAr
                    ? 'تتيح منصة خدمات لحساب التاجر إنشاء صفحة متجر، رفع المنتجات، ومشاركة رابط عام، واستقبال طلبات واتساب وفق المزايا المتاحة حالياً. قد تُضاف لاحقاً ميزات أو باقات مدفوعة؛ وسيُعلن عن أي تغيير على الاستخدام أو التسعير مسبقاً حيث ينطبق ذلك.'
                    : 'Khadamat lets merchant accounts create a store page, list products, share a public link, and receive WhatsApp orders according to currently available features. Paid plans or add-ons may be introduced later; we will announce material changes to usage or pricing in advance where applicable.'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#165B91] mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              {t('terms.aboutUs')}
            </h2>
            <Card className="border-[#165B91]/20 rounded-2xl shadow-sm">
              <CardContent className="pt-6 space-y-3 text-[#1A1A2E] leading-relaxed">
                <p>{isAr ? 'منصة خدمات منصة رقمية تساعد أصحاب الأعمال الصغيرة والتجار على إطلاق صفحة متجر جاهزة بسرعة: عرض المنتجات، التنسيق البصري، رابط قصير، وربط الطلبات برقم واتساب دون الحاجة لمتجر برمجي معقّد.' : 'Khadamat is a digital platform that helps small businesses and merchants launch a ready-made store page quickly: showcase products, simple branding, a shareable link, and connect orders to WhatsApp without building a complex ecommerce site.'}</p>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h3 className="font-bold mb-2">{isAr ? 'ملاحظات مهمة:' : 'Important Notes:'}</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>{isAr ? 'نحن نوفّر الأدوات التقنية فقط؛ البيع والشحن والضمان والمطالبات المالية تتم بين التاجر وعملائه.' : 'We provide technical tools only; selling, shipping, warranties, and payment claims are between merchants and their customers.'}</li>
                    <li>{isAr ? 'التزامات المنصة محدودة بتشغيل الخدمة وحماية البيانات وفق هذه السياسات.' : 'The platform\'s obligations are limited to operating the service and protecting data as described in these policies.'}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#165B91]/5 border-2 border-[#165B91]/25 rounded-2xl">
            <CardContent className="pt-6 text-center">
              <h3 className="font-bold text-lg mb-2 text-[#1A1A2E]">{t('terms.finalApproval')}</h3>
              <p className="text-[#6B7280] leading-relaxed">
                {isAr
                  ? 'بالضغط على "موافق" أو الاستمرار في استخدام منصة خدمات، أقر بأنني قد قرأت وفهمت جميع الشروط وأوافق عليها.'
                  : 'By clicking "Agree" or continuing to use Khadamat, I acknowledge that I have read and understood all terms and agree to them.'}
              </p>
            </CardContent>
          </Card>

          <div 
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#165B91]/30 bg-[#165B91]/5 cursor-pointer hover:border-[#165B91] transition-all"
            onClick={() => navigate('/auth?agreed=true')}
          >
            <Checkbox className="h-6 w-6 border-[#165B91] data-[state=checked]:bg-[#165B91]" />
            <p className="text-[#1A1A2E] font-bold">
              {t('terms.agreeTerms')}
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#E5E7EB] py-8 mt-12 bg-white">
        <div className="container mx-auto px-4 text-center text-[#6B7280]">
          <p>© {new Date().getFullYear()} {t('index.tabkhatyRights')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
