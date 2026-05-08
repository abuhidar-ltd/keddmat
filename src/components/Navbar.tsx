import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-brand-purple/10 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2 border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white font-semibold"
              >
                <LayoutDashboard className="h-4 w-4" />
                لوحة التحكم
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2 text-gray-500 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => navigate('/auth')}
              className="font-bold text-white bg-gradient-to-br from-brand-purple to-brand-cyan hover:opacity-95 shadow-md"
            >
              سجل الآن
            </Button>
          )}
        </div>

        <Link to="/" className="flex items-center gap-2 py-1">
          <BrandLogo height={40} className="max-h-10" />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
