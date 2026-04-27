import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import LanguageToggle from "@/components/LanguageToggle";
import { User, Store, Wrench, Menu, X, LogIn } from "lucide-react";
import logo from "@/assets/logo-khadamat.png";

const Header = () => {
  const { user, loading, userType } = useAuth();
  const { t, dir, language } = useLanguage();
  const isAr = language === "ar";
  const location = useLocation();
  const [pageSlug, setPageSlug] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) { setPageSlug(null); return; }
    const fetchSlug = async () => {
      const { data: profile } = await supabase.from('profiles').select('page_slug').eq('user_id', user.id).maybeSingle();
      if (profile?.page_slug) setPageSlug(profile.page_slug);
    };
    fetchSlug();
  }, [user]);

  const isHome = location.pathname === "/";

  const navLinks = [
    { label: isAr ? "الرئيسية" : "Home", to: "/" },
    { label: isAr ? "الخدمات" : "Services", to: isHome ? "#services" : "/browse" },
    { label: isAr ? "كيف نعمل" : "How It Works", to: isHome ? "#how-it-works" : "/#how-it-works" },
    { label: isAr ? "تواصل معنا" : "Contact", to: isHome ? "#contact" : "/#contact" },
  ];

  const handleNavClick = (to: string) => {
    setMobileOpen(false);
    if (to.startsWith("#")) {
      const el = document.querySelector(to);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-[#E5E7EB]" dir={dir}>
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="خدمات" className="w-11 h-11 object-contain" />
          <span className="font-extrabold text-lg text-[#165B91] hidden sm:block">خدمات</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5">
          {navLinks.map((link) =>
            link.to.startsWith("#") ? (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.to)}
                className="text-sm font-semibold text-[#1A1A2E] hover:text-[#165B91] transition-colors"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                className="text-sm font-semibold text-[#1A1A2E] hover:text-[#165B91] transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            userType === 'merchant' ? (
              <div className="flex items-center gap-2">
                {pageSlug && (
                  <Button variant="ghost" className="text-[#165B91] hover:bg-[#165B91]/5 hidden sm:inline-flex" asChild>
                    <Link to={`/p/${pageSlug}`}>
                      <Store className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                      <span>{t('header.myStore')}</span>
                    </Link>
                  </Button>
                )}
                <Button asChild className="btn-cta px-5 py-2 text-sm hidden sm:inline-flex">
                  <Link to="/dashboard">
                    <Wrench className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1.5' : 'mr-1.5'}`} />
                    <span>{t('header.addService')}</span>
                  </Link>
                </Button>
              </div>
            ) : userType === 'customer' ? (
              <Button variant="ghost" className="text-[#165B91] hover:bg-[#165B91]/5" asChild>
                <Link to="/customer">
                  <User className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                  <span className="hidden sm:inline">{t('customer.myAccount')}</span>
                </Link>
              </Button>
            ) : <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : (
            <Button variant="outline" className="border-[#165B91] text-[#165B91] hover:bg-[#165B91]/5 text-sm font-bold gap-1.5" asChild>
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{isAr ? "تسجيل الدخول" : "Login"}</span>
              </Link>
            </Button>
          )}

          <button
            className="md:hidden p-2 rounded-lg text-[#1A1A2E] hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E7EB] px-4 py-4 space-y-3 shadow-lg">
          {navLinks.map((link) =>
            link.to.startsWith("#") ? (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.to)}
                className="block w-full text-right text-sm font-semibold text-[#1A1A2E] hover:text-[#165B91] py-2"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-semibold text-[#1A1A2E] hover:text-[#165B91] py-2"
              >
                {link.label}
              </Link>
            )
          )}
          {user && userType === 'merchant' && pageSlug && (
            <Link to={`/p/${pageSlug}`} onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#165B91] py-2">{t('header.myStore')}</Link>
          )}
          {user && userType === 'merchant' && (
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-sm font-bold text-[#165B91] py-2">{t('header.addService')}</Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
