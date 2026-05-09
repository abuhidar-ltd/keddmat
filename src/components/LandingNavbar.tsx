import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, LayoutDashboard } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BrandLogo } from '@/components/BrandLogo';

const LandingNavbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const handleSignOut = async () => {
    await signOut();
    close();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/90 backdrop-blur-md">
      <div className="relative mx-auto flex min-h-[5.25rem] items-center justify-center px-4 py-3 sm:min-h-[5.75rem] sm:py-4 md:min-h-[6.5rem] md:px-6">
        <Link
          to="/"
          className="flex items-center py-1 transition-opacity hover:opacity-90"
          aria-label="Keddmat - الرئيسية"
        >
          <BrandLogo className="h-20 w-auto sm:h-24 md:h-28" />
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute end-3 top-1/2 z-10 h-10 w-10 -translate-y-1/2 text-gray-800 hover:bg-gray-100 sm:end-4"
              aria-label="القائمة"
            >
              <Menu className="h-6 w-6" strokeWidth={2} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100%,320px)] border-l border-gray-100" dir="rtl">
            <SheetHeader className="text-right">
              <SheetTitle className="text-right text-lg font-bold text-gray-900">القائمة</SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-1 text-right">
              <Button variant="ghost" className="justify-end text-base font-semibold" asChild onClick={close}>
                <Link to="/auth">أنشئ متجرك الآن</Link>
              </Button>
              <Button variant="ghost" className="justify-end text-base" asChild onClick={close}>
                <Link to="/terms">الشروط والأحكام</Link>
              </Button>
              {user ? (
                <>
                  <Button variant="ghost" className="justify-end text-base" asChild onClick={close}>
                    <Link to="/dashboard" className="inline-flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      لوحة التحكم
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-end text-base text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={handleSignOut}
                  >
                    <span className="inline-flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </span>
                  </Button>
                </>
              ) : null}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default LandingNavbar;
