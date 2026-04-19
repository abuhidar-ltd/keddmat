import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import LanguageToggle from "@/components/LanguageToggle";
import { User, Store, LogIn, Wrench } from "lucide-react";
import logo from "@/assets/logo-khadamat.png";



const Header = () => {
  const { user, loading, userType } = useAuth();
  const { t, dir } = useLanguage();
  
  
  const [pageSlug, setPageSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setPageSlug(null); return; }
    const fetchSlug = async () => {
      const { data: profile } = await supabase.from('profiles').select('page_slug').eq('user_id', user.id).maybeSingle();
      if (profile?.page_slug) setPageSlug(profile.page_slug);
    };
    fetchSlug();
  }, [user]);

  

  return (
    <header className="sticky top-0 z-50 bg-white text-foreground shadow-md border-b border-border" dir={dir}>
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="خدمات" className="w-12 h-12 object-contain" />
          <span className="font-bold text-lg hidden sm:block text-[rgba(9,92,164,1)]">{t('header.tabkhaty')}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <LanguageToggle />
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            userType === 'merchant' ? (
              <div className="flex items-center gap-2">
                {pageSlug && (
              <Button variant="ghost" className="text-foreground hover:bg-primary/5" asChild>
                    <Link to={`/p/${pageSlug}`}>
                      <Store className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                      <span>{t('header.myStore')}</span>
                    </Link>
                  </Button>
                )}
                <Button variant="secondary" size="lg" asChild className="font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/dashboard">
                    <Wrench className={`h-5 w-5 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    <span>{t('header.addService')}</span>
                  </Link>
                </Button>
              </div>
            ) : userType === 'customer' ? (
              <Button variant="ghost" className="text-foreground hover:bg-primary/5" asChild>
                <Link to="/customer">
                  <User className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                  <span className="hidden sm:inline">{t('customer.myAccount')}</span>
                </Link>
              </Button>
            ) : ( <div className="w-8 h-8 rounded-full bg-muted animate-pulse" /> )
          ) : (
            <Button className="bg-[rgba(7,166,68,0.9)] hover:bg-[rgba(7,166,68,1)] text-accent-foreground font-bold" asChild>
              <Link to="/auth?type=merchant">
                <LogIn className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                <span>{t('header.loginProvider')}</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
