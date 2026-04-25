import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import LanguageToggle from "@/components/LanguageToggle";
import { User, Store, Wrench, Menu, X } from "lucide-react";
import logo from "@/assets/logo-khadamat.png";

const Header = () => {
  const { user, loading, userType } = useAuth();
  const { t, dir } = useLanguage();
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

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-[#E5E7EB]" dir={dir}>
      <div className="container flex items-center justify-between h-16 px-4">
        {/* Logo — right side in RTL */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="خدمات" className="w-11 h-11 object-contain" />
          <span className="font-extrabold text-lg text-[#56B36B] hidden sm:block">خدمات</span>
        </Link>

        {/* Center nav links — desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-semibold text-[#1A1A2E] hover:text-[#56B36B] transition-colors">الرئيسية</Link>
          <Link to="/browse" className="text-sm font-semibold text-[#1A1A2E] hover:text-[#56B36B] transition-colors">تصفح الخدمات</Link>
        </nav>

        {/* Right actions — left side in RTL */}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            userType === 'merchant' ? (
              <div className="flex items-center gap-2">
                {pageSlug && (
                  <Button variant="ghost" className="text-[#56B36B] hover:bg-[#56B36B]/5 hidden sm:inline-flex" asChild>
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
              <Button variant="ghost" className="text-[#56B36B] hover:bg-[#56B36B]/5" asChild>
                <Link to="/customer">
                  <User className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                  <span className="hidden sm:inline">{t('customer.myAccount')}</span>
                </Link>
              </Button>
            ) : <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : null}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[#1A1A2E] hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E7EB] px-4 py-4 space-y-3 shadow-lg">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#1A1A2E] hover:text-[#56B36B] py-2">الرئيسية</Link>
          <Link to="/browse" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#1A1A2E] hover:text-[#56B36B] py-2">تصفح الخدمات</Link>
          {user && userType === 'merchant' && pageSlug && (
            <Link to={`/p/${pageSlug}`} onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#56B36B] py-2">{t('header.myStore')}</Link>
          )}
          {user && userType === 'merchant' && (
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-sm font-bold text-[#56B36B] py-2">{t('header.addService')}</Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
