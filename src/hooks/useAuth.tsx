import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { slugifyLatin } from '@/lib/slug';
import { digitsFromMerchantEmail, isAdminPhoneDigits } from '@/lib/adminPhones';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, phone: string, storeName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, phone: string, storeName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, data: { phone } },
    });
    if (!error && data.user) {
      const base = slugifyLatin(storeName || '');
      const slug = base.length >= 3 ? `${base}-${Date.now().toString(36)}` : `store-${Date.now()}`;
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        phone,
        store_name: storeName || '',
        page_slug: slug,
        whatsapp_number: phone,
        is_active: false,
      });
      if (profileError) return { error: new Error(profileError.message) };

      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (isAdminPhoneDigits(cleanPhone)) {
        await supabase.from('user_roles').insert({ user_id: data.user.id, role: 'admin' });
      }
    }
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: new Error(error.message) };
    const digits = digitsFromMerchantEmail(email);
    if (data.user && digits && isAdminPhoneDigits(digits)) {
      const { data: existing } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!existing) {
        await supabase.from('user_roles').insert({ user_id: data.user.id, role: 'admin' });
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
