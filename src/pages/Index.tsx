import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES, getSubcategories } from "@/lib/categoryIcons";
import logoImage from "@/assets/logo-khadamat.png";
import { Store, Users, ShieldCheck, TrendingUp, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Index = () => {
  const { t, dir, language } = useLanguage();
  const { user, userType } = useAuth();
  const navigate = useNavigate();
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  if (user && userType === "merchant") {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const services = CATEGORIES;
  const isAr = language === "ar";

  const handleCategoryClick = (category: string) => {
    const subs = getSubcategories(category);
    if (subs.length > 0) {
      setSelectedCategory(category);
      setSubcategoryOpen(true);
    } else {
      navigate(`/category/${encodeURIComponent(category)}`);
    }
  };

  const features = [
    {
      icon: Store,
      title: isAr ? "متجرك الخاص" : "Your Own Store",
      desc: isAr
        ? "متجر خاص فيك تعرض فيه شغلك وخدماتك ومنتجاتك"
        : "Your own shop to showcase your work and services",
    },
    {
      icon: Users,
      title: isAr ? "عملاء أكثر" : "More Customers",
      desc: isAr
        ? "وصل لخدمة أكثر عدد ممكن من العملاء في منطقتك"
        : "Reach more customers in your area easily",
    },
    {
      icon: ShieldCheck,
      title: isAr ? "ثقة ومصداقية" : "Trust & Credibility",
      desc: isAr
        ? "تقييمات وآراء العملاء تزيد ثقة الناس بخدماتك"
        : "Ratings and reviews build trust in your services",
    },
    {
      icon: TrendingUp,
      title: isAr ? "أعمال أكثر" : "More Business",
      desc: isAr
        ? "احصل على طلبات أكثر وزود دخلك بسهولة"
        : "Get more orders and grow your income easily",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={dir}>
      <Header />

      {/* ── Hero Section ── */}
      <section className="py-14 md:py-20 bg-white">
        <div className="container px-4">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">
            {/* Left: Illustration */}
            <div className="flex-1 flex justify-center animate-float">
              <img
                src={logoImage}
                alt="خدمات"
                className="w-56 md:w-72 lg:w-80 h-auto object-contain drop-shadow-xl"
              />
            </div>
            {/* Right: Text */}
            <div className="flex-1 text-right space-y-5 animate-fade-in">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-snug text-[#1A1A2E]">
                {isAr ? (
                  <>
                    إذا كنت حرفي وحابب يكون
                    <br />
                    <span className="text-[#00BCD4]">إلك حضور أونلاين...</span>
                    <br />
                    <span className="text-[#2D7D46]">هذا المكان إلك</span>
                  </>
                ) : (
                  <>
                    If you're a craftsman
                    <br />
                    <span className="text-[#00BCD4]">
                      and want an online presence...
                    </span>
                    <br />
                    <span className="text-[#2D7D46]">This place is yours</span>
                  </>
                )}
              </h1>
              <p className="text-[#6B7280] text-base md:text-lg leading-relaxed max-w-md">
                {isAr
                  ? "مع خدمات صار عندك متجر رقمي خاص فيك تعرض فيه شغلك وخدماتك وتبيع منتجاتك بسهولة، والعملاء بيشوفوا شغلك ويتواصلوا معك مباشرة"
                  : "With Khadamat you get your own digital store to showcase your work, services and products easily — customers see your work and contact you directly"}
              </p>
              <div className="flex gap-3 justify-end flex-wrap">
                <Link
                  to="/auth?type=merchant"
                  className="btn-cta px-8 py-3 text-base inline-flex items-center gap-2"
                >
                  {isAr ? "ابدأ كحرفي" : "Start as a Craftsman"}
                </Link>
                <Link
                  to="/browse"
                  className="px-8 py-3 rounded-full border-2 border-[#2D7D46] text-[#2D7D46] font-bold text-base hover:bg-[#2D7D46]/5 transition-colors inline-flex items-center gap-2"
                >
                  {isAr ? "تصفح متاجر الحرفيين" : "Browse Craftsmen's Shops"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Strip ── */}
      <section className="py-14 md:py-16 section-alt">
        <div className="container px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A2E] mb-3">
            {isAr
              ? "كل شغلك بمكان واحد... بدون تشتت"
              : "All Your Work in One Place... Without Confusion"}
          </h2>
          <p className="text-[#6B7280] mb-10 text-base">
            {isAr
              ? "منصة بتخليك تبين بشكل احترافي وتوصل لعملاء أكثر بثقة أعلى"
              : "A platform that makes you look professional and reach more customers with higher trust"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center hover-lift"
              >
                <div className="w-14 h-14 rounded-full bg-[#2D7D46]/10 flex items-center justify-center mb-4">
                  <f.icon className="h-7 w-7 text-[#2D7D46]" />
                </div>
                <h3 className="font-extrabold text-base text-[#1A1A2E] mb-1">
                  {f.title}
                </h3>
                <p className="text-gray-700 text-xs leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Grid ── */}
      <section className="py-14 md:py-16 bg-white">
        <div className="container px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A2E] text-center mb-2">
            {isAr ? "اختر نوع الخدمة" : "Choose Service Type"}
          </h2>
          <p className="text-[#6B7280] text-center mb-10">
            {isAr
              ? "تصفح مقدمي الخدمات حسب التخصص"
              : "Browse service providers by specialty"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {services.map((svc, i) => (
              <button
                key={svc.labelKey}
                onClick={() => handleCategoryClick(svc.category)}
                className={`group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white shadow-md border border-[#E5E7EB] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-fade-in stagger-${Math.min(i + 1, 6)}`}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                  style={{ background: `${svc.hex}18` }}
                >
                  <svc.icon className="h-7 w-7" style={{ color: svc.hex }} />
                </div>
                <span className="text-sm font-bold text-[#1A1A2E] leading-tight text-center">
                  {t(svc.labelKey)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Subscription CTA ── */}
      <section className="py-14 md:py-16 section-alt">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[#2D7D46]/10 flex items-center justify-center">
                <Award className="h-10 w-10 text-[#2D7D46]" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A2E] leading-snug">
              {isAr ? (
                <>
                  <span className="text-[#2D7D46]">الاشتراك مجاني</span> حالياً{" "}
                  <span className="text-[#00BCD4]">لفترة محدودة</span>
                </>
              ) : (
                <>
                  <span className="text-[#2D7D46]">Subscription is free</span>{" "}
                  right now{" "}
                  <span className="text-[#00BCD4]">for a limited time</span>
                </>
              )}
            </h2>
            <p className="text-[#6B7280] text-base">
              {isAr
                ? "سجل الآن واستفد من جميع الميزات بدون أي رسوم"
                : "Register now and enjoy all features with no charges"}
            </p>
            <Link
              to="/auth?type=merchant"
              className="btn-cta px-10 py-3.5 text-base inline-flex items-center gap-2"
            >
              {isAr ? "سجل الآن ›" : "Register Now ›"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-dark text-white py-12">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Logo + tagline */}
            <div className="flex flex-col items-end text-right gap-3">
              <div className="flex items-center gap-2">
                <img
                  src={logoImage}
                  alt="خدمات"
                  className="w-10 h-10 object-contain"
                />
                <span className="font-extrabold text-xl">خدمات</span>
              </div>
            </div>

            {/* Quick links */}
            <div className="text-center">
              <h4 className="font-bold text-base mb-4 text-white">
                {isAr ? "روابط سريعة" : "Quick Links"}
              </h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>
                  <Link
                    to="/"
                    className="hover:text-[#00BCD4] transition-colors"
                  >
                    {isAr ? "الرئيسية" : "Home"}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/browse"
                    className="hover:text-[#00BCD4] transition-colors"
                  >
                    {isAr ? "تصفح متاجر الحرفيين" : "Browse Craftsmen's Shops"}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth?type=merchant"
                    className="hover:text-[#00BCD4] transition-colors"
                  >
                    {isAr ? "انضم كحرفي" : "Join as Craftsman"}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-[#00BCD4] transition-colors"
                  >
                    {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact / Social */}
            <div className="text-left">
              <h4 className="font-bold text-base mb-4 text-white">
                {isAr ? "تواصل معنا" : "Contact Us"}
              </h4>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/share/1C81VLBJKH/?mibextid=wwXIfr"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#00BCD4]/30 flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#00BCD4]/30 flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path
                      d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <line
                      x1="17.5"
                      y1="6.5"
                      x2="17.51"
                      y2="6.5"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </a>
                <a
                  href="https://wa.me/+962799126390"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#00BCD4]/30 flex items-center justify-center transition-colors"
                  aria-label="WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-gray-400 text-xs">
              باستخدامك للموقع أنت توافق على{" "}
              <Link to="/terms" className="text-[#00BCD4] hover:underline">
                {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
              </Link>{" "}
              و سياسة الخصوصية
            </p>
            <p className="text-gray-500 text-xs mt-2">
              © {new Date().getFullYear()} {t("index.tabkhatyRights")}
            </p>
          </div>
        </div>
      </footer>

      {/* Subcategories Dialog */}
      <Dialog open={subcategoryOpen} onOpenChange={setSubcategoryOpen}>
        <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-extrabold text-[#1A1A2E]">
              {selectedCategory}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {getSubcategories(selectedCategory).map((sub) => {
              const catInfo = CATEGORIES.find(
                (c) => c.category === selectedCategory,
              );
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSubcategoryOpen(false);
                    navigate(
                      `/category/${encodeURIComponent(selectedCategory)}?sub=${encodeURIComponent(sub.id)}`,
                    );
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  style={{ borderColor: `${catInfo?.hex || "#2D7D46"}25` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${catInfo?.hex || "#2D7D46"}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${catInfo?.hex || "#2D7D46"}25`;
                  }}
                >
                  <span className="text-sm font-bold text-center text-[#1A1A2E]">
                    {language === "ar" ? sub.labelAr : sub.labelEn}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => {
                setSubcategoryOpen(false);
                navigate(`/category/${encodeURIComponent(selectedCategory)}`);
              }}
              className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl btn-cta font-bold"
            >
              {language === "ar" ? "عرض الكل" : "View All"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
