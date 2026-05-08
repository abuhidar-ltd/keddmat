import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'loophereinit@protonmail.com';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[useAdmin] user.email:', user?.email);
      setIsAdmin(user?.email === ADMIN_EMAIL);
      setAdminLoading(false);
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[useAdmin] auth change, email:', session?.user?.email);
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
      setAdminLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, adminLoading };
}
