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
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">{t('terms.khadamat')}</Link>
          <Button variant="outline" asChild>
            <Link to="/auth" className="flex items-center gap-2">
              <ArrowIcon className="w-4 h-4" />
              {t('terms.back')}
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            {t('terms.title')}
          </h1>
          <p className="text-muted-foreground">{t('terms.readCarefully')}</p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('terms.privacyPolicy')}
            </h2>
            <Card className="border-primary/20 mb-3">
              <CardContent className="pt-6 space-y-4 text-foreground leading-relaxed">
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
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5" />
              {t('terms.disclaimer')}
            </h2>
            <div className="space-y-3">
              <Card className="border-primary/20">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-primary/10 shrink-0 mt-1"><Users className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-bold mb-1">{isAr ? '1. منصة وسيطة فقط:' : '1. Intermediary Platform Only:'}</p>
                    <p className="text-sm text-foreground leading-relaxed">{isAr ? 'منصة خدمات تعمل كوسيط رقمي يربط بين العملاء ومقدمي الخدمات.' : 'Khadamat platform works as a digital intermediary connecting customers with service providers.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-primary/10 shrink-0 mt-1"><FileCheck className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-bold mb-1">{isAr ? '2. عدم المسؤولية عن الخدمات:' : '2. No Liability for Services:'}</p>
                    <p className="text-sm text-foreground leading-relaxed">{isAr ? 'المنصة ليست مسؤولة عن جودة الخدمات المقدمة.' : 'The platform is not responsible for the quality of services provided.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-primary/10 shrink-0 mt-1"><CreditCard className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-bold mb-1">{isAr ? '3. عدم المسؤولية عن المدفوعات:' : '3. No Liability for Payments:'}</p>
                    <p className="text-sm text-foreground leading-relaxed">{isAr ? 'أي معاملات مالية تتم مباشرة بين الطرفين.' : 'Any financial transactions are conducted directly between the two parties.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-primary/10 shrink-0 mt-1"><UserCheck className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-bold mb-1">{isAr ? '4. النزاعات:' : '4. Disputes:'}</p>
                    <p className="text-sm text-foreground leading-relaxed">{isAr ? 'المنصة ليست طرفاً في أي نزاع بين العميل ومقدم الخدمة.' : 'The platform is not a party to any dispute between the customer and service provider.'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="p-2.5 rounded-full bg-primary/10 shrink-0 mt-1"><Ban className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-bold mb-1">{isAr ? '5. التعديلات:' : '5. Modifications:'}</p>
                    <p className="text-sm text-foreground leading-relaxed">{isAr ? 'تحتفظ المنصة بحق تعديل هذه السياسات في أي وقت.' : 'The platform reserves the right to modify these policies at any time.'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5" />
              {isAr ? 'الاشتراك المجاني' : 'Free Subscription'}
            </h2>
            <Card className="border-primary/20">
              <CardContent className="pt-6 text-foreground leading-relaxed">
                <p>
                  {isAr
                    ? 'يحصل الحرفيون عند التسجيل لأول مرة على فترة اشتراك مجانية لمدة شهر، وبعد انتهاء الفترة المجانية يمكن للحرفي الاستمرار بالاستفادة من خدمات المنصة من خلال اشتراك شهري، وذلك بشكل اختياري لمن يرغب بالاستمرار.'
                    : 'Craftsmen receive a free one-month subscription upon first registration. After the free period ends, they can continue using the platform through an optional monthly subscription.'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              {t('terms.aboutUs')}
            </h2>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-3 text-foreground leading-relaxed">
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

          <Card className="bg-muted/50 border-2 border-primary/30">
            <CardContent className="pt-6 text-center">
              <h3 className="font-bold text-lg mb-2">{t('terms.finalApproval')}</h3>
              <p className="text-foreground leading-relaxed">
                {isAr
                  ? 'بالضغط على "موافق" أو الاستمرار في استخدام منصة خدمات، أقر بأنني قد قرأت وفهمت جميع الشروط وأوافق عليها.'
                  : 'By clicking "Agree" or continuing to use Khadamat platform, I acknowledge that I have read and understood all terms and agree to them.'}
              </p>
            </CardContent>
          </Card>

          <div 
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary/30 bg-muted/50 cursor-pointer hover:border-success transition-all"
            onClick={() => navigate('/auth?agreed=true')}
          >
            <Checkbox className="h-6 w-6" />
            <p className="text-foreground font-bold">
              {t('terms.agreeTerms')}
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} {t('index.tabkhatyRights')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
