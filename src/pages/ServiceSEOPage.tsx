import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { SERVICE_SEO_DATA } from '@/lib/serviceSEO';
import { GOVERNORATES } from '@/lib/governorates';
import { getCategoryInfo, CATEGORIES } from '@/lib/categoryIcons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Star, Shield, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import logoImage from '@/assets/logo-khadamat.png';

const ServiceSEOPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, dir, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Find the service data
  const serviceData = SERVICE_SEO_DATA.find(s => s.slug === slug);

  // Check if it's a governorate-specific page
  const isGovernoratePage = slug && slug.includes('-') && !serviceData;
  let govServiceData = serviceData;
  let governorate: typeof GOVERNORATES[0] | undefined;

  if (isGovernoratePage && slug) {
    const parts = slug.split('-');
    const govSlug = parts.pop();
    const baseSlug = parts.join('-');
    const baseService = SERVICE_SEO_DATA.find(s => s.slug === baseSlug);
    governorate = GOVERNORATES.find(g => g.labelEn.toLowerCase().replace(/[^a-z]/g, '') === govSlug);
    if (baseService && governorate) {
      govServiceData = {
        ...baseService,
        titleAr: `${baseService.titleAr} في ${governorate.labelAr}`,
        descriptionAr: baseService.descriptionAr.replace('في الأردن', `في ${governorate.labelAr}`),
        keywordsAr: [...baseService.keywordsAr, `${baseService.titleAr} ${governorate.labelAr}`],
      };
    }
  }

  const data = govServiceData || serviceData;
  const categoryInfo = data ? getCategoryInfo(data.category) : undefined;
  const CategoryIcon = categoryInfo?.icon;

  // Set document title for SEO
  useEffect(() => {
    if (data) {
      document.title = `${data.titleAr} - خدمات | منصة الخدمات المنزلية في الأردن`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', data.descriptionAr);
    }
    return () => {
      document.title = 'خدمات - منصة خدمات منزلية والصيانة العامة في الأردن';
    };
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('seo.pageNotFound')}</h1>
          <Link to="/" className="text-primary hover:underline">{t('seo.backHome')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12 md:py-20">
        <div className="container text-center space-y-6">
          {CategoryIcon && <CategoryIcon className={`h-16 w-16 mx-auto ${categoryInfo?.color || 'text-primary'}`} />}
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground">
            {data.titleAr}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {data.descriptionAr}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate(`/category/${encodeURIComponent(data.category)}`)}
              className="font-bold text-base"
            >
              {t('seo.browseProviders')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth?type=merchant')}
              className="font-bold text-base"
            >
              {t('seo.registerAsProvider')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-card">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{t('seo.whyChoose')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Shield, text: t('seo.trustedProviders') },
              { icon: Clock, text: t('seo.instantEmergency') },
              { icon: MapPin, text: t('seo.allGovernorates') },
              { icon: Star, text: t('seo.realRatings') },
            ].map((f, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-6 space-y-3">
                  <f.icon className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-bold text-sm">{f.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-12">
        <div className="container max-w-3xl space-y-6">
          <h2 className="text-2xl font-bold">{language === 'ar' ? `خدمات ${data.titleAr} في الأردن` : `${data.titleAr} Services in Jordan`}</h2>
          {data.contentAr.map((paragraph, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed text-base">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Governorates Grid */}
      {!isGovernoratePage && (
        <section className="py-12 bg-card">
          <div className="container">
            <h2 className="text-2xl font-bold text-center mb-8">{data.titleAr} {t('seo.inAllGovernorates')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {GOVERNORATES.map(gov => {
                const govSlug = `${data.slug}-${gov.labelEn.toLowerCase().replace(/[^a-z]/g, '')}`;
                return (
                  <Link
                    key={gov.value}
                    to={`/services/${govSlug}`}
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{data.titleAr} في {gov.labelAr}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {data.faqAr.length > 0 && (
        <section className="py-12">
          <div className="container max-w-3xl">
            <h2 className="text-2xl font-bold mb-8 text-center">{t('seo.faq')}</h2>
            <div className="space-y-4">
              {data.faqAr.map((faq, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-base mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground text-sm">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* FAQ JSON-LD */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  mainEntity: data.faqAr.map(faq => ({
                    '@type': 'Question',
                    name: faq.q,
                    acceptedAnswer: { '@type': 'Answer', text: faq.a },
                  })),
                }),
              }}
            />
          </div>
        </section>
      )}

      {/* Other Services */}
      <section className="py-12 bg-card">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-8">{t('seo.otherServices')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {SERVICE_SEO_DATA.filter(s => s.slug !== data.slug).map(svc => {
              const info = getCategoryInfo(svc.category);
              const Icon = info?.icon;
              return (
                <Link
                  key={svc.slug}
                  to={`/services/${svc.slug}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary hover:shadow-md transition-all bg-background"
                >
                  {Icon && <Icon className={`h-6 w-6 ${info?.color || 'text-primary'}`} />}
                  <span className="text-xs font-bold text-center">{svc.titleAr}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">{language === 'ar' ? `جاهز تطلب ${data.titleAr}؟` : `Ready to order ${data.titleAr}?`}</h2>
          <p className="text-muted-foreground">{language === 'ar' ? 'سجل الآن واطلب خدمتك خلال دقائق' : 'Register now and order your service in minutes'}</p>
          <div className="flex justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/auth?type=customer')} className="font-bold">
              {t('index.registerCustomer')}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth?type=merchant')} className="font-bold">
              {t('seo.registerAsProvider')}
            </Button>
          </div>
        </div>
      </section>

      {/* Service JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: data.titleAr,
            description: data.descriptionAr,
            provider: { '@type': 'Organization', name: 'خدمات' },
            areaServed: governorate
              ? { '@type': 'City', name: governorate.labelAr }
              : { '@type': 'Country', name: 'Jordan' },
            serviceType: data.titleAr,
          }),
        }}
      />

      <footer className="border-t border-border py-6 bg-card">
        <div className="container text-center space-y-3 px-4">
          <div className="flex justify-center items-center gap-6">
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('index.termsConditions')}</Link>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {t('index.tabkhatyRights')}</p>
        </div>
      </footer>
    </div>
  );
};

export default ServiceSEOPage;
