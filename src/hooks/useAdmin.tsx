import { useMemo } from 'react';
import { useAuth } from './useAuth';

const ADMIN_EMAILS = ['0795666185@keddmat.com'];
const ADMIN_PHONES = ['0795666185', '962795666185', '+962795666185'];

export const useAdmin = () => {
  const { user, loading } = useAuth();

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (user.email && ADMIN_EMAILS.includes(user.email)) return true;
    if (user.phone && ADMIN_PHONES.includes(user.phone)) return true;
    return false;
  }, [user]);

  return { isAdmin, loading };
};