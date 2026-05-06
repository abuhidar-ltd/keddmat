import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = '0795666185@keddmat.com';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[useAdmin] user.email:', user?.email);
      setIsAdmin(user?.email === ADMIN_EMAIL);
      setLoading(false);
    };
    check();
  }, []);

  return { isAdmin, loading };
};