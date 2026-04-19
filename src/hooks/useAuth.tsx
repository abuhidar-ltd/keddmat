import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserType = 'customer' | 'merchant' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userType: UserType;
  signUp: (email: string, password: string, phone: string, address?: string, category?: string, emergencyMode?: boolean, name?: string, subcategories?: string[]) => Promise<{ error: Error | null }>;
  signUpCustomer: (email: string, password: string, phone: string, address?: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<UserType>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          setTimeout(() => { checkUserType(session.user.id, true); }, 0);
        } else {
          setUserType(null);
        }
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) { checkUserType(session.user.id); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkUserType = async (userId: string, skipIfSet = false) => {
    if (skipIfSet && userType) return;
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const metaType = currentUser?.user_metadata?.user_type;
    if (metaType === 'merchant' || metaType === 'customer') { setUserType(metaType); return; }
    const { data: merchantProfile } = await supabase.from('profiles').select('id').eq('user_id', userId).maybeSingle();
    if (merchantProfile) { setUserType('merchant'); return; }
    const { data: customerProfile } = await supabase.from('customer_profiles').select('id').eq('user_id', userId).maybeSingle();
    if (customerProfile) { setUserType('customer'); return; }
    setUserType(null);
  };

  const signUp = async (email: string, password: string, phone: string, address?: string, category?: string, emergencyMode?: boolean, name?: string, subcategories?: string[]) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl, data: { phone, user_type: 'merchant', address, category, emergency_mode: emergencyMode } } });
    if (!error && data.user) {
      const savedCountry = localStorage.getItem('user_selected_country') || 'JO';
      const { error: profileError } = await supabase.from('profiles').insert({ user_id: data.user.id, phone, display_name: category || '', store_name: name || '', page_slug: `user-${Date.now()}`, user_type: 'merchant', country: savedCountry, service_location: address || 'عمّان', category: category || '', emergency_mode: emergencyMode || false, page_enabled: true, whatsapp_number: phone, subcategories: subcategories || [] });
      if (profileError) return { error: new Error(profileError.message) };
      setUserType('merchant');
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const adminPhones = ['0799126390', '962799126390', '0795666158', '962795666158', '0796830150', '962796830150', '123456', '123456789'];
      if (adminPhones.some(p => cleanPhone === p || cleanPhone === p.replace(/^0/, ''))) {
        await supabase.from('user_roles').insert({ user_id: data.user.id, role: 'admin' });
      }
    }
    return { error: error ? new Error(error.message) : null };
  };

  const signUpCustomer = async (email: string, password: string, phone: string, address?: string, name?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl, data: { phone, user_type: 'customer', address } } });
    if (!error && data.user) {
      const { error: profileError } = await supabase.from('customer_profiles').insert({ user_id: data.user.id, phone, display_name: name || '', address: address || '' });
      if (profileError) return { error: new Error(profileError.message) };
      setUserType('customer');
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const adminPhones = ['0799126390', '962799126390', '0795666158', '962795666158', '0796830150', '962796830150', '123456', '123456789'];
      if (adminPhones.some(p => cleanPhone === p || cleanPhone === p.replace(/^0/, ''))) {
        await supabase.from('user_roles').insert({ user_id: data.user.id, role: 'admin' });
      }
    }
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userType, signUp, signUpCustomer, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};