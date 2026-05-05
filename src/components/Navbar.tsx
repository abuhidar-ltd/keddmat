import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Store, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left side: actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2 border-[#2D7D46] text-[#2D7D46] hover:bg-[#2D7D46] hover:text-white font-semibold"
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
              className="font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #2D7D46, #00BCD4)' }}
            >
              سجل الآن
            </Button>
          )}
        </div>

        {/* Right side: logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2D7D46, #00BCD4)' }}>
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-gray-900">خدمات</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
