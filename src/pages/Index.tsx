import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CATEGORIES, getSubcategories } from "@/lib/categoryIcons";
import logoImage from "@/assets/logo-khadamat.png";
import EmergencyRequestModal from "@/components/EmergencyRequestModal";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Index = () => {
  const { t, dir, language } = useLanguage();
  const { user, userType } = useAuth();
  const navigate = useNavigate();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  if (user && userType === 'merchant') {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const services = CATEGORIES;

  const handleCategoryClick = (category: string) => {
    const subs = getSubcategories(category);
    if (subs.length > 0) {
      setSelectedCategory(category);
      setSubcategoryOpen(true);
    } else {
      navigate(`/category/${encodeURIComponent(category)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bokeh-bg" dir={dir}>
      {/* Subtle blue accent circles only */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[hsl(213_90%_60%)] blur-[120px] opacity-[0.08] top-1/4 left-1/4" />
        <div className="absolute w-[250px] h-[250px] rounded-full bg-[hsl(200_95%_60%)] blur-[100px] opacity-[0.06] top-2/3 right-1/4" />
      </div>

      <Header />

      <section className="flex-1 py-8 md:py-14 relative z-10">
        <div className="container flex flex-col items-center text-center space-y-6">
          <div className="animate-glow-pulse">
            <img src={logoImage} alt={t('header.tabkhaty')} className="w-[200px] md:w-[240px] h-auto object-contain animate-fade-in" />
          </div>
          <h1 className="text-lg md:text-2xl font-extrabold text-[rgba(28,105,156,1)] leading-tight">
            {t('index.heroMainPrefix')}{t('index.heroMainHighlight')}{t('index.heroMainSuffix')}
          </h1>

          {/* Emergency Service Box */}
          {userType === 'merchant' ? (
            <button
              onClick={() => navigate('/dashboard?tab=emergency')}
              className="w-full max-w-[300px] h-[55px] bg-[hsl(25_95%_55%)] hover:bg-[hsl(25_95%_50%)] text-white rounded-xl px-6 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] font-bold text-lg"
            >
              <AlertTriangle className="h-6 w-6 animate-pulse" />
              {t('index.emergencyOrders')}
            </button>
          ) : (
            <button
              onClick={() => {
                setEmergencyOpen(true);
              }}
              className="w-full max-w-[300px] h-[55px] bg-[hsl(25_95%_55%)] hover:bg-[hsl(25_95%_50%)] text-white rounded-xl px-6 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] font-bold text-lg"
            >
              <AlertTriangle className="h-6 w-6 animate-pulse" />
              {language === 'ar' ? 'اضغط لطلب صيانة طارئة' : 'Request Emergency Maintenance'}
            </button>
          )}

          <h2 className="text-[18px] md:text-lg font-bold text-[rgba(5,92,170,1)]">{t('index.chooseService')}</h2>

          {/* Category Grid - 2 columns with glass effect */}
          <div className="grid grid-cols-2 gap-4 max-w-xl w-full">
            {services.map((svc, i) => (
              <button
                key={svc.labelKey}
                onClick={() => handleCategoryClick(svc.category)}
                className={`group relative flex items-center gap-4 p-5 h-[70px] rounded-2xl glass-card transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 cursor-pointer animate-fade-in stagger-${i + 1}`}
                style={{
                  borderColor: `${svc.hex}30`,
                  boxShadow: `0 0 20px ${svc.hex}10`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${svc.hex}60`;
                  e.currentTarget.style.boxShadow = `0 0 30px ${svc.hex}25, inset 0 0 30px ${svc.hex}08`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${svc.hex}30`;
                  e.currentTarget.style.boxShadow = `0 0 20px ${svc.hex}10`;
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                  style={{ background: `${svc.hex}20` }}
                >
                  <svc.icon className="h-7 w-7" style={{ color: svc.hex }} />
                </div>
                <span className="text-sm md:text-base font-bold text-foreground leading-tight text-start">{t(svc.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <EmergencyRequestModal open={emergencyOpen} onOpenChange={setEmergencyOpen} />
      
      {/* Subcategories Dialog */}
      <Dialog open={subcategoryOpen} onOpenChange={setSubcategoryOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-foreground">
              {selectedCategory}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {getSubcategories(selectedCategory).map((sub) => {
              const catInfo = CATEGORIES.find(c => c.category === selectedCategory);
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSubcategoryOpen(false);
                    navigate(`/category/${encodeURIComponent(selectedCategory)}?sub=${encodeURIComponent(sub.id)}`);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl glass-card transition-all hover:scale-[1.03]"
                  style={{
                    borderColor: `${catInfo?.hex || '#00BCD4'}30`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${catInfo?.hex || '#00BCD4'}60`;
                    e.currentTarget.style.boxShadow = `0 0 20px ${catInfo?.hex || '#00BCD4'}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${catInfo?.hex || '#00BCD4'}30`;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span className="text-sm font-bold text-center text-foreground">{language === 'ar' ? sub.labelAr : sub.labelEn}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                setSubcategoryOpen(false);
                navigate(`/category/${encodeURIComponent(selectedCategory)}`);
              }}
              className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all"
            >
              {language === 'ar' ? 'عرض الكل' : 'View All'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-border py-6 bg-white/50 backdrop-blur-sm relative z-10">
        <div className="container text-center space-y-3 px-4">
          <div className="flex justify-center items-center gap-6">
            <Link to="/terms" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[rgb(249,122,32)] hover:bg-[rgba(249,122,32,0.9)] px-4 py-1.5 rounded-full transition-colors shadow-sm">{t('index.termsConditions')}</Link>
          </div>
          <p className="text-[15px] text-black max-w-lg mx-auto">
            باستخدامك للموقع أنت توافق على الشروط والأحكام و سياسة الخصوصية
          </p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {t('index.tabkhatyRights')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
