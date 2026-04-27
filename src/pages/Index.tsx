import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import EmergencyRequestModal from "@/components/EmergencyRequestModal";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES, getSubcategories } from "@/lib/categoryIcons";
import logoImage from "@/assets/logo-khadamat.png";
import {
  Phone,
  ArrowLeft,
} from "lucide-react";
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
  const [emergencyOpen, setEmergencyOpen] = useState(false);

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

  const displayServices = services.slice(0, 6);

  const stats = [
    { value: "24/7", label: isAr ? "خدمة متاحة" : "Available", icon: "🕐" },
    { value: "5000+", label: isAr ? "طلب مكتمل" : "Orders Done", icon: "📋" },
    { value: "350+", label: isAr ? "حرفي محترف" : "Pro Craftsmen", icon: "👷" },
    { value: "1200+", label: isAr ? "عميل سعيد" : "Happy Clients", icon: "😊" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={dir}>
      <Header />

      {/* ── Hero Section ── */}
      <section className="py-10 md:py-16 lg:py-20 bg-gradient-to-b from-[#EFF3F8] to-white">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-right space-y-5 animate-fade-in">
            <div className="flex justify-center">
              <img
                src={logoImage}
                alt="خدمات"
                className="w-32 sm:w-36 md:w-40 h-auto object-contain"
              />
            </div>

            <div className="space-y-5">
              <h1 className="text-[25px] md:text-4xl lg:text-5xl font-extrabold leading-snug tracking-tight">
                {isAr ? (
                  <>
                    <span className="text-[rgba(3,101,155,1)]">جميع خدمات</span>
                    <br />
                    <span className="text-[#55AB1C]">الصيانة المنزلية</span>{" "}
                    <span className="text-[#FB923C]">بين يديك</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#3B82C4]">All Home</span>
                    <br />
                    <span className="text-[#FB923C]">Services</span>{" "}
                    <span className="text-[#55AB1C]">At Your Fingertips</span>
                  </>
                )}
              </h1>
              <p className="text-[rgba(75,92,104,1)] font-semibold text-base md:text-lg leading-relaxed max-w-lg ms-auto">
                {isAr
                  ? "نحن هنا لتقديم أفضل الخدمات المنزلية بسرعة"
                  : "We are here to provide the best home services quickly, professionally and reliably"}
              </p>

              <div className="max-w-[500px] mx-auto rounded-2xl px-4 py-3 bg-gradient-to-l from-[#C2410C] via-[#EA580C] to-[#F97316]">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => setEmergencyOpen(true)}
                    className="bg-white text-[#9A3412] font-extrabold px-4 py-2 rounded-full hover:bg-white/90 transition-colors shadow-lg flex items-center gap-2 shrink-0 text-sm sm:text-base"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {isAr ? "اضغط لطلب صيانة منزلية فورا" : "Request Emergency Maintenance"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Emergency Banner ── */}
      <section className="-mt-2 pt-0 pb-2 bg-white">
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Link
              to="/browse"
              className="h-[48px] px-8 py-3 rounded-full bg-[#165B91] text-white font-bold text-base hover:bg-[#124a76] transition-colors inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {isAr ? "تصفح متاجر الحرفيين" : "Browse Craftsmen's Shops"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section id="services" className="py-14 md:py-16 bg-white">
        <div className="container px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#105A8E] mb-2">
            {isAr ? "اختر الخدمة" : "Our Services"}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-3xl mx-auto">
            {displayServices.map((svc, i) => {
              return (
                <button
                  key={svc.labelKey}
                  onClick={() => handleCategoryClick(svc.category)}
                  className={`group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white shadow-md border border-[#E5E7EB] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-fade-in stagger-${Math.min(i + 1, 6)}`}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ background: `${svc.hex}18` }}
                  >
                    <svc.icon className="h-6 w-6" style={{ color: svc.hex }} />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-[#105A8E] leading-tight text-center">
                    {t(svc.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>

          <Link
            to="/browse"
            className="inline-flex items-center gap-2 mt-10 px-8 py-3 rounded-full border-2 border-[#165B91] text-[#165B91] font-bold text-sm hover:bg-[#165B91]/5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {isAr ? "عرض جميع الخدمات" : "View All Services"}
          </Link>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-10 md:py-14 bg-white border-y border-[#E5E7EB]">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.value} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-2xl bg-[#EFF3F8]">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xl md:text-2xl font-black text-[#105A8E]">{s.value}</span>
                <span className="text-[11px] font-bold text-[#6B7280]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workers Signup CTA ── */}
      <section className="py-8 md:py-10 bg-white">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto rounded-2xl border border-[#E5E7EB] bg-gradient-to-l from-[#EFF3F8] to-white p-5 md:p-6 text-center">
            <h3 className="text-xl md:text-2xl font-extrabold text-[#105A8E]">
              {isAr ? "هل أنت حرفي محترف؟" : "Are you a professional worker?"}
            </h3>
            <p className="mt-2 text-sm md:text-base text-[#6B7280]">
              {isAr
                ? "انضم الآن كمقدم خدمة وابدأ باستقبال طلبات جديدة يوميا"
                : "Join now as a service provider and start receiving new requests daily"}
            </p>
            <Link
              to="/auth?type=merchant"
              className="inline-flex items-center justify-center gap-2 mt-5 px-8 py-3 rounded-full btn-cta font-bold text-sm md:text-base"
            >
              <ArrowLeft className="h-4 w-4" />
              {isAr ? "سجل كمقدم خدمة" : "Sign up as a Provider"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" className="footer-dark text-white py-12">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Col 1: Logo + tagline + social */}
            <div className="flex flex-col items-end text-right gap-4">
              <div className="flex items-center gap-2">
                <img src={logoImage} alt="خدمات" className="w-10 h-10 object-contain" />
                <span className="font-extrabold text-xl">خدمات</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
                {isAr
                  ? "منصة خدمات منزلية متكاملة تربطك بأفضل الحرفيين المحترفين لتقديم خدمات عالية الجودة"
                  : "A comprehensive home services platform connecting you with the best professional craftsmen"}
              </p>
              {/* Social icons */}
              <div className="flex gap-3 mt-1">
                <a
                  href="https://www.facebook.com/share/1C81VLBJKH/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
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
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#165B91]/30 flex items-center justify-center transition-colors"
                  aria-label="X / Twitter"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
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

            {/* Col 2: Important links */}
            <div className="text-center">
              <h4 className="font-bold text-base mb-4 text-white">
                {isAr ? "روابط مهمة" : "Important Links"}
              </h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>
                  <Link to="/" className="hover:text-[#165B91] transition-colors">
                    {isAr ? "الرئيسية" : "Home"}
                  </Link>
                </li>
                <li>
                  <Link to="/browse" className="hover:text-[#165B91] transition-colors">
                    {isAr ? "تصفح متاجر الحرفيين" : "Browse Craftsmen's Shops"}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#165B91] transition-colors">
                    {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
                  </Link>
                </li>
                <li>
                  <Link to="/auth?type=merchant" className="hover:text-[#165B91] transition-colors">
                    {isAr ? "تسجيل كمقدم خدمة" : "Register as Provider"}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Our services */}
            <div className="text-left">
              <h4 className="font-bold text-base mb-4 text-white">
                {isAr ? "خدماتنا" : "Our Services"}
              </h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                {displayServices.map((svc) => (
                  <li key={svc.category}>
                    <button
                      onClick={() => handleCategoryClick(svc.category)}
                      className="hover:text-[#165B91] transition-colors text-right w-full"
                    >
                      {t(svc.labelKey)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-gray-400 text-xs">
              {isAr ? "باستخدامك للموقع أنت توافق على" : "By using the site you agree to"}{" "}
              <Link to="/terms" className="text-[#165B91] hover:underline">
                {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
              </Link>{" "}
              {isAr ? "و سياسة الخصوصية" : "and Privacy Policy"}
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

      {/* Emergency Request Modal */}
      <EmergencyRequestModal open={emergencyOpen} onOpenChange={setEmergencyOpen} />
    </div>
  );
};

export default Index;
