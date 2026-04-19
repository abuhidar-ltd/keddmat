import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Loader2, LogOut, User } from 'lucide-react';

const Customer = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, userType } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [displayName, setDisplayName] = useState('');

  const userPhone = user?.email?.replace('.customer@phone.local', '').replace('.merchant@phone.local', '').replace('@phone.local', '') || '';

  useEffect(() => {
    if (!loading && !user) { navigate('/auth?type=customer'); return; }
    if (!loading && userType === 'merchant') navigate('/dashboard');
  }, [user, loading, userType, navigate]);

  useEffect(() => {
    if (user && userType === 'customer') fetchProfileData();
  }, [user, userType]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoadingProfile(true);
    const { data, error } = await supabase.from('customer_profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (!error && data) { setDisplayName(data.display_name || ''); }
    else if (!error && !data) {
      await supabase.from('customer_profiles').insert({ user_id: user.id, phone: userPhone.substring(0, 20), display_name: '' });
    }
    setLoadingProfile(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('customer_profiles').update({ display_name: displayName }).eq('user_id', user.id);
    if (error) { toast({ title: t('common.error'), description: t('customer.saveError'), variant: 'destructive' }); }
    else { toast({ title: t('customer.saved'), description: t('customer.dataUpdated') }); }
    setSaving(false);
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  if (loading || (user && userType === null) || loadingProfile) {
    return (<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);
  }
  if (!user || userType !== 'customer') return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('customer.myAccount')}</h1>
          <Button variant="ghost" onClick={handleSignOut}><LogOut className="mx-2 h-4 w-4" />{t('customer.logout')}</Button>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />{t('customer.profile')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>{t('customer.name')}</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('customer.namePlaceholder')} /></div>
            <div className="space-y-2"><Label>{t('customer.phone')}</Label><Input value={userPhone} disabled dir="ltr" /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? t('customer.saving') : t('customer.save')}</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Customer;