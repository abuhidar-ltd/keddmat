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
    <div className="min-h-screen bg-[#F7FAF8]" dir={dir}>
      <header className="bg-white border-b border-[#E5E7EB] shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-extrabold text-[#56B36B]">{t('terms.khadamat')}</Link>
          <Button variant="outline" asChild className="border-[#56B36B] text-[#56B36B] hover:bg-[#56B36B]/5">
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
            <h2 className="text-xl font-bold text-[#56B36B] mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('terms.privacyPolicy')}
            </h2>
            <Card className="border-[#56B36B]/20 rounded-2xl shadow-sm mb-3">
              <CardContent className="pt-6 space-y-4 text-[#1A1A2E] leading-relaxed">
                <p>{isAr ? 'نحن في منصة خدمات نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.' : 'At Khadamat platform, we respect your privacy and are committed to protecting your personal data.'}</p>
                <div>
                  <h3 className="font-bold mb-2">{isAr ? 'جمع المعلومات:' : 'Information Collection:'}</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>{isAr ? 'نقوم بجمع المعلومات التي تقدمها عند التسجيل أو استخدام المنصة.' : 'We collect information you provide when registering or using the platform.'}</li>
                    <li>{isAr ? 'نقوم بجمع بعض المعلومات التلقائية عن استخدامك للمنصة لتحسين تجربة المستخدم.' : 'We collect some automatic information about your usage to improve the user experience.'}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2">{isAr ? 'استخدام المعلومات:' : 'Use of Information:'}</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>{isAr ? 'تُستخدم البيانات لتسهيل التواصل بين مقدم الخدمة والعميل.' : 'Data is used to facilitate communication between service providers and customers.'}</li>
                    <li>{isAr ? 'لا نقوم ببيع أو مشاركة معلوماتك الشخصية مع أطراف ثالثة.' : 'We do not sell or share your personal information with third parties.'}</li>
                  </ul>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h3 className="font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /> {isAr ? 'ملاحظات مهمة:' : 'Important Notes:'}</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>{isAr ? 'المنصة لا تتحمل أي مسؤولية عن أي تعامل بين العميل ومقدم الخدمة.' : 'The platform bears no responsibility for any dealings between the customer and service provider.'}</li>
                    <li>{isAr ? 'أي دفع يتم بين الطرفين يتم خارج المنصة وعلى مسؤولية الطرفين.' : 'Any payment between the two parties is made outside the platform and at their own responsibility.'}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#56B36B] mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5" />
              {t('terms.disclaimer')}
            </h2>
            <div className="space-y-3">
              <Card className="border-[#56B36B]/20 rounded-2xl shadow-sm">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-[#56B36B]/10 shrink-0 mt-1"><Users className="w-5 h-5 text-[#56B36B]" /></div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A2E]">{isAr ? '1. منصة وسيطة فقط:' : '1. Intermediary Platform Only:'}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{isAr ? 'منصة خدمات تعمل كوسيط رقمي يربط بين العملاء ومقدمي الخدمات.' : 'Khadamat platform works as a digital intermediary connecting customers with service providers.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#56B36B]/20 rounded-2xl shadow-sm">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-[#56B36B]/10 shrink-0 mt-1"><FileCheck className="w-5 h-5 text-[#56B36B]" /></div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A2E]">{isAr ? '2. عدم المسؤولية عن الخدمات:' : '2. No Liability for Services:'}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{isAr ? 'المنصة ليست مسؤولة عن جودة الخدمات المقدمة.' : 'The platform is not responsible for the quality of services provided.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#56B36B]/20 rounded-2xl shadow-sm">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-[#56B36B]/10 shrink-0 mt-1"><CreditCard className="w-5 h-5 text-[#56B36B]" /></div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A2E]">{isAr ? '3. عدم المسؤولية عن المدفوعات:' : '3. No Liability for Payments:'}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{isAr ? 'أي معاملات مالية تتم مباشرة بين الطرفين.' : 'Any financial transactions are conducted directly between the two parties.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#56B36B]/20 rounded-2xl shadow-sm">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-[#56B36B]/10 shrink-0 mt-1"><UserCheck className="w-5 h-5 text-[#56B36B]" /></div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A2E]">{isAr ? '4. النزاعات:' : '4. Disputes:'}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{isAr ? 'المنصة ليست طرفاً في أي نزاع بين العميل ومقدم الخدمة.' : 'The platform is not a party to any dispute between the customer and service provider.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#56B36B]/20 rounded-2xl shadow-sm">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-[#56B36B]/10 shrink-0 mt-1"><Ban className="w-5 h-5 text-[#56B36B]" /></div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A2E]">{isAr ? '5. التعديلات:' : '5. Modifications:'}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{isAr ? 'تحتفظ المنصة بحق تعديل هذه السياسات في أي وقت.' : 'The platform reserves the right to modify these policies at any time.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#56B36B]/20 rounded-2xl shadow-sm">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-[#56B36B]/10 shrink-0 mt-1"><Shield className="w-5 h-5 text-[#56B36B]" /></div>
                  <div>
                    <p className="font-bold mb-1 text-[#1A1A2E]">{isAr ? '6. التراخيص والموافقات الرسمية:' : '6. Licenses and Official Approvals:'}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{isAr ? 'يتحمل كل حرفي ومقدم خدمات كامل المسؤولية عن الحصول على جميع التراخيص والموافقات الرسمية اللازمة لممارسة نشاطه وفق القوانين المعمول بها في بلده، ولا تتحمل المنصة أي مسؤولية قانونية عن ذلك.' : 'Every craftsman and service provider bears full responsibility for obtaining all licenses and official approvals required to practice their activity in accordance with the applicable laws in their country. The platform bears no legal responsibility for this.'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#56B36B] mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5" />
              {isAr ? 'الاشتراك المجاني' : 'Free Subscription'}
            </h2>
            <Card className="border-[#56B36B]/20 rounded-2xl shadow-sm">
              <CardContent className="pt-6 text-[#1A1A2E] leading-relaxed">
                <p>
                  {isAr
                    ? 'يحصل الحرفيون عند التسجيل لأول مرة على فترة اشتراك مجانية لمدة شهر، وبعد انتهاء الفترة المجانية يمكن للحرفي الاستمرار بالاستفادة من خدمات المنصة من خلال اشتراك شهري، وذلك بشكل اختياري لمن يرغب بالاستمرار.'
                    : 'Craftsmen receive a free one-month subscription upon first registration. After the free period ends, they can continue using the platform through an optional monthly subscription.'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#56B36B] mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              {t('terms.aboutUs')}
            </h2>
            <Card className="border-[#56B36B]/20 rounded-2xl shadow-sm">
              <CardContent className="pt-6 space-y-3 text-[#1A1A2E] leading-relaxed">
                <p>{isAr ? 'منصة خدمات هي منصة رقمية تهدف إلى تسهيل الوصول إلى الخدمات المنزلية العامة وخدمات الصيانة المنزلية الطارئة والصيانة الطارئة للمركبات على الطرقات في مكان واحد.' : 'Khadamat is a digital platform that aims to facilitate access to general home services, emergency home maintenance services, and emergency vehicle maintenance on roads in one place.'}</p>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h3 className="font-bold mb-2">{isAr ? 'ملاحظات مهمة:' : 'Important Notes:'}</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>{isAr ? 'نحن منصة وسيطة فقط، ولا نقدم الخدمات مباشرة.' : 'We are only an intermediary platform and do not provide services directly.'}</li>
                    <li>{isAr ? 'أي اتفاق بين العميل ومقدم الخدمة يتم على مسؤولية الطرفين.' : 'Any agreement between the customer and provider is at both parties\' responsibility.'}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#56B36B]/5 border-2 border-[#56B36B]/25 rounded-2xl">
            <CardContent className="pt-6 text-center">
              <h3 className="font-bold text-lg mb-2 text-[#1A1A2E]">{t('terms.finalApproval')}</h3>
              <p className="text-[#6B7280] leading-relaxed">
                {isAr
                  ? 'بالضغط على "موافق" أو الاستمرار في استخدام منصة خدمات، أقر بأنني قد قرأت وفهمت جميع الشروط وأوافق عليها.'
                  : 'By clicking "Agree" or continuing to use Khadamat platform, I acknowledge that I have read and understood all terms and agree to them.'}
              </p>
            </CardContent>
          </Card>

          <div 
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#56B36B]/30 bg-[#56B36B]/5 cursor-pointer hover:border-[#56B36B] transition-all"
            onClick={() => navigate('/auth?agreed=true')}
          >
            <Checkbox className="h-6 w-6 border-[#56B36B] data-[state=checked]:bg-[#56B36B]" />
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
