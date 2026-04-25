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
import { Loader2, LogOut, User, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Customer = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, userType } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      if (error || (data && (data as any).error)) {
        const message = (data as any)?.error || error?.message || 'فشل حذف الحساب';
        toast({ title: 'خطأ', description: message, variant: 'destructive' });
        setDeleting(false);
        return;
      }
      toast({ title: 'تم حذف الحساب', description: 'تم حذف حسابك بنجاح' });
      await signOut();
      navigate('/');
    } catch (err: any) {
      toast({ title: 'خطأ', description: err?.message || 'فشل حذف الحساب', variant: 'destructive' });
      setDeleting(false);
    }
  };

  if (loading || (user && userType === null) || loadingProfile) {
    return (<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-[#165B91]" /></div>);
  }
  if (!user || userType !== 'customer') return null;

  return (
    <div className="min-h-screen bg-[#EFF3F8]">
      <Header />
      <main className="container py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-[#1A1A2E]">{t('customer.myAccount')}</h1>
          <Button variant="ghost" onClick={handleSignOut} className="text-[#6B7280] hover:text-[#1A1A2E]">
            <LogOut className="mx-2 h-4 w-4" />{t('customer.logout')}
          </Button>
        </div>
        <Card className="max-w-2xl mx-auto rounded-2xl border-[#E5E7EB] shadow-md overflow-hidden">
          <CardHeader className="bg-[#165B91]/5 border-b border-[#E5E7EB]">
            <CardTitle className="flex items-center gap-3 text-[#1A1A2E]">
              <div className="w-10 h-10 rounded-full bg-white ring-2 ring-[#165B91]/30 flex items-center justify-center shadow-sm">
                <User className="h-5 w-5 text-[#165B91]" />
              </div>
              {t('customer.profile')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="font-semibold text-[#1A1A2E]">{t('customer.name')}</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('customer.namePlaceholder')}
                className="border-[#E5E7EB] focus:border-[#165B91] focus:ring-[#165B91]/20 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-[#1A1A2E]">{t('customer.phone')}</Label>
              <Input value={userPhone} disabled dir="ltr" className="border-[#E5E7EB] rounded-xl bg-[#EFF3F8]" />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-cta w-full py-3 text-sm disabled:opacity-60"
            >
              {saving ? t('customer.saving') : t('customer.save')}
            </button>

            <div className="pt-4 mt-4 border-t border-[#E5E7EB] space-y-3">
              <div>
                <h3 className="font-bold text-destructive">حذف الحساب</h3>
                <p className="text-sm text-[#6B7280] mt-1">
                  عند حذف حسابك سيتم حذف جميع بياناتك بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={deleting}>
                    {deleting ? (
                      <><Loader2 className="mx-2 h-4 w-4 animate-spin" />جاري الحذف...</>
                    ) : (
                      <><Trash2 className="h-4 w-4 mx-2" />حذف الحساب</>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد أنك تريد حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      نعم، احذف حسابي
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Customer;