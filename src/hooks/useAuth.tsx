import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { generateSlug } from '@/lib/slug';
import { isAdminPhoneDigits } from '@/lib/adminPhones';

// IMPORTANT: In Supabase Dashboard → Authentication → Settings,
// "Enable email confirmations" MUST be turned OFF.
// We use fake emails (phone@keddmat.com) so confirmation emails are never received.
const phoneToEmail = (phone: string) => phone.replace(/[\s\-+]/g, '') + '@keddmat.com';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (phone: string, password: string, storeName?: string) => Promise<{ error: Error | null }>;
  signIn: (phone: string, password: string) => Promise<{ error: Error | null }>;
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

  const signUp = async (phone: string, password: string, storeName?: string) => {
    const cleanPhone = phone.replace(/[\s\-+]/g, '');
    const email = phoneToEmail(cleanPhone);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      const base = generateSlug(storeName || '');
      const slug = base ? `${base}-${Date.now().toString(36)}` : `store-${Date.now().toString(36)}`;
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: data.user.id,
        phone: cleanPhone,
        store_name: storeName || '',
        page_slug: slug,
        whatsapp_number: cleanPhone,
        is_active: false,
      }, { onConflict: 'user_id' });
      if (profileError) return { error: new Error(profileError.message) };

      if (isAdminPhoneDigits(cleanPhone)) {
        await supabase.from('user_roles').insert({ user_id: data.user.id, role: 'admin' });
      }
    }
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (phone: string, password: string) => {
    const cleanPhone = phone.replace(/[\s\-+]/g, '');
    const email = phoneToEmail(cleanPhone);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: new Error(error.message) };
    if (data.user && isAdminPhoneDigits(cleanPhone)) {
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
