import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES, getSubcategories } from "@/lib/categoryIcons";
import logoImage from "@/assets/logo-khadamat.png";
import { Store, Users } from "lucide-react";
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
      title: isAr ? "فنيون قريبون منك" : "Nearby Technicians",
      desc: isAr
        ? "اعثر على فنيين وصيّانة منزلية داخل منطقتك بسرعة"
        : "Find home maintenance technicians in your area quickly",
    },
    {
      icon: Users,
      title: isAr ? "اختيار أسهل" : "Easier Choice",
      desc: isAr
        ? "قارن بين مقدمي الخدمة واختر الأنسب لاحتياجك"
        : "Compare service providers and pick what fits your needs",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={dir}>
      <Header />

      {/* ── Hero Section ── */}
      <section className="py-10 md:py-16 lg:py-20 bg-white">
        <div className="container px-4 max-w-xl mx-auto sm:max-w-2xl lg:max-w-3xl">
          <div className="flex flex-col items-center gap-6">
            {/* Logo — top, compact on all breakpoints */}
            <div className="flex shrink-0 justify-center">
              <div className="animate-float rounded-2xl bg-white/90 p-3 sm:p-4 shadow-sm">
                <img
                  src={logoImage}
                  alt="خدمات"
                  className="w-32 sm:w-36 md:w-40 h-auto object-contain"
                />
              </div>
            </div>
            <div className="w-full flex-1 text-right space-y-5 animate-fade-in">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-snug tracking-tight text-[#105A8E]">
                {isAr ? (
                  <>
                    عندك عطل بالمنزل؟
                    <br />
                    <span className="text-[#55AB1C]">اطلب فني صيانة</span>
                    <br />
                    <span className="text-[#4094D4]">
                      خلال دقائق، بدون تعب البحث
                    </span>
                  </>
                ) : (
                  <>
                    If you're a craftsman
                    <br />
                    <span className="text-[#165B91]">
                      and want an online presence...
                    </span>
                    <br />
                    <span className="text-[#165B91]">This place is yours</span>
                  </>
                )}
              </h1>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:justify-end sm:items-stretch w-[90%] max-w-[90%] ms-auto sm:max-w-[90%]">
                <Link
                  to="/browse?emergency=1"
                  className="h-[42px] w-[270px] px-5 sm:px-6 py-3 rounded-full bg-[#EA580C] text-white font-bold text-sm sm:text-base hover:bg-[#FF692E] transition-colors inline-flex items-center justify-center gap-2 active:opacity-95"
                >
                  {isAr ? "اضغط لطلب صيانة طارئة" : "Emergency Order"}
                </Link>
                <Link
                  to="/browse"
                  className="h-[42px] w-[270px] px-5 sm:px-6 py-3 rounded-full border-2 border-[#165B91] text-[#165B91] font-bold text-sm sm:text-base hover:bg-[#165B91]/5 transition-colors inline-flex items-center justify-center gap-2 active:opacity-95"
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
          <h2 className="text-2xl md:text-3xl font-extrabold text-[rgba(85,171,29,1)] mb-3">
            {isAr
              ? "كل خدمات الصيانه المنزليه بموقع"
              : "All Maintenance Services Within Reach"}
          </h2>
          <p className="text-[#6B7280] mb-12 md:mb-14 text-base">
            {isAr
              ? "منصة تساعدك تلاقي الفني المناسب بسرعة، بثقة، وبدون تعب"
              : "A platform that helps you find the right technician quickly and confidently"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto mt-2 md:mt-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl shadow-md p-3.5 sm:p-4 flex flex-col items-center text-center hover-lift"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#165B91]/10 flex items-center justify-center mb-2">
                  <f.icon className="h-5 w-5 text-[#165B91]" />
                </div>
                <h3 className="font-extrabold text-sm text-[#105A8E] mb-0.5 leading-tight">
                  {f.title}
                </h3>
                <p className="text-gray-700 text-xs leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Grid ── */}
      <section className="py-14 md:py-16 bg-white">
        <div className="container px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#105A8E] text-center mb-2">
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
                <span className="text-sm font-bold text-[#105A8E] leading-tight text-center">
                  {t(svc.labelKey)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-dark text-white py-12">
        <div className="container px-4">
          <div className="mb-10 rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 md:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-start">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-[#165B91]/25 flex items-center justify-center shrink-0">
                  <Store className="h-6 w-6 text-[#165B91]" />
                </div>
                <div className="space-y-2 min-w-0">
                  <h3 className="font-extrabold text-lg md:text-xl text-white">
                    {isAr
                      ? "أنت حرفي أو مقدم خدمة؟"
                      : "Are you a craftsman or service provider?"}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {isAr
                      ? "سجّل متجرك على المنصة واعرض خدماتك وتواصل مع العملاء بسهولة."
                      : "Register your shop on the platform, list your services, and connect with customers easily."}
                  </p>
                </div>
              </div>
              <Link
                to="/auth?type=merchant"
                className="btn-cta px-8 py-3 text-sm md:text-base font-bold inline-flex items-center justify-center gap-2 shrink-0 w-full md:w-auto"
              >
                {t("header.loginProvider")}
              </Link>
            </div>
          </div>

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
                    className="hover:text-[#165B91] transition-colors"
                  >
                    {isAr ? "الرئيسية" : "Home"}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/browse"
                    className="hover:text-[#165B91] transition-colors"
                  >
                    {isAr ? "تصفح متاجر الحرفيين" : "Browse Craftsmen's Shops"}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-[#165B91] transition-colors"
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
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#165B91]/30 flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#165B91]/30 flex items-center justify-center transition-colors"
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
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#165B91]/30 flex items-center justify-center transition-colors"
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
              <Link to="/terms" className="text-[#165B91] hover:underline">
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
            <DialogTitle className="text-center text-xl font-extrabold text-[#105A8E]">
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
                  style={{ borderColor: `${catInfo?.hex || "#165B91"}25` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${catInfo?.hex || "#165B91"}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${catInfo?.hex || "#165B91"}25`;
                  }}
                >
                  <span className="text-sm font-bold text-center text-[#105A8E]">
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
