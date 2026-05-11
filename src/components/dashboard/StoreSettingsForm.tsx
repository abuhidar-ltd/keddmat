import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

import { Copy, Check, Loader2, Camera, Image as ImageIcon, Trash2, ExternalLink, CreditCard, MessageCircle } from 'lucide-react';
import type { Profile } from '@/types/keddmat';
import { getPublicSiteUrl } from '@/lib/siteUrl';
import { slugifyLatin, generateSlug } from '@/lib/slug';

const StoreSettingsForm = () => {
  const { user, signOut } = useAuth();
  const { uploadImage, uploading } = useImageUpload();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cliqUsername, setCliqUsername] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  // Auto-populate slug from store name while slug is still unset
  useEffect(() => {
    if (!profile.page_slug && profile.store_name) {
      setProfile(prev => ({ ...prev, page_slug: generateSlug(profile.store_name || '') }));
    }
  }, [profile.store_name]);

  // Poll is_active after returning from Stripe checkout until webhook fires
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'success') return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.is_active) {
        setProfile(prev => ({ ...prev, is_active: true }));
        clearInterval(interval);
      }
    }, 3000);

    const timeout = setTimeout(() => clearInterval(interval), 30000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [user]);

  const fetchProfile = async () => {
    const [profileRes, settingsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('app_settings').select('value').eq('key', 'cliq_username').maybeSingle(),
    ]);
    if (profileRes.data) {
      const p = profileRes.data as Profile;
      setProfile(p);
      setCharCount(p.store_description?.length || 0);
      if (!p.whatsapp_number && user?.email?.endsWith('@keddmat.com')) {
        const phone = user.email.replace('@keddmat.com', '');
        setProfile(prev => ({ ...prev, whatsapp_number: phone }));
        await supabase.from('profiles').update({ whatsapp_number: phone }).eq('user_id', user!.id);
      }
    }
    if (settingsRes.data?.value) setCliqUsername(settingsRes.data.value);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const slug = slugifyLatin(profile.page_slug?.trim() || '') || generateSlug(profile.store_name || '');
    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      store_name: profile.store_name || '',
      store_description: profile.store_description || '',
      whatsapp_number: profile.whatsapp_number || '',
      page_slug: slug,
      avatar_url: profile.avatar_url,
      cover_url: profile.cover_url,
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast({ title: 'فشل الحفظ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم الحفظ ✓' });
      setProfile(prev => ({ ...prev, page_slug: slug }));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const url = await uploadImage(file, user.id, 'avatars');
    if (url) {
      setProfile(prev => ({ ...prev, avatar_url: url }));
      await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
      toast({ title: 'تم تحديث الصورة ✓' });
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const url = await uploadImage(file, user.id, 'covers');
    if (url) {
      setProfile(prev => ({ ...prev, cover_url: url }));
      await supabase.from('profiles').update({ cover_url: url }).eq('user_id', user.id);
      toast({ title: 'تم تحديث صورة الغلاف ✓' });
    }
  };

  const copyLink = async () => {
    const link = `${getPublicSiteUrl()}/store/${profile.page_slug}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: 'تم نسخ الرابط ✓' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const { error } = await supabase.functions.invoke('cancel-and-delete', {
      body: { targetUserId: user.id }
    });
    if (error) {
      toast({ title: 'حدث خطأ، يرجى المحاولة مرة أخرى', variant: 'destructive' });
      return;
    }
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handlePublish = async () => {
    if (!user) return;
    setPublishing(true);
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { userId: user.id, email: user.email },
    });
    setPublishing(false);
    if (error || !data?.url) {
      toast({ title: 'حدث خطأ في فتح صفحة الدفع', variant: 'destructive' });
      return;
    }
    window.location.href = data.url;
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    setManagingSubscription(true);
    const { data, error } = await supabase.functions.invoke('manage-subscription', {
      body: { userId: user.id },
    });
    setManagingSubscription(false);
    if (error || !data?.url) {
      toast({ title: 'حدث خطأ في فتح صفحة الاشتراك', variant: 'destructive' });
      return;
    }
    window.location.href = data.url;
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-purple" /></div>;

  const storeLink = `${getPublicSiteUrl()}/store/${profile.page_slug || ''}`;

  return (
    <div className="space-y-6 p-1">
      {/* Store Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border">
        <p className="font-semibold text-gray-800">حالة المتجر</p>
        {profile.is_active ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700 border-0 text-sm px-3 py-1">متجرك نشط ✓</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleManageSubscription}
              disabled={managingSubscription}
              className="rounded-xl text-xs border-brand-purple/30 text-brand-purple hover:bg-brand-purple/5 h-8"
            >
              {managingSubscription
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : 'إدارة الاشتراك'}
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => setShowPaymentModal(true)}
            disabled={publishing}
            className="rounded-xl font-bold text-white primary-gradient border-0 h-9 px-4"
          >
            فعّل متجرك
          </Button>
        )}
      </div>

      {/* Payment method modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent dir="rtl" className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">اختر طريقة الدفع</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            {/* Stripe option */}
            <Card className="flex-1 border border-brand-purple/20 rounded-2xl cursor-pointer hover:border-brand-purple/60 hover:shadow-md transition-all">
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-xl bg-brand-purple/10">
                  <CreditCard className="h-7 w-7 text-brand-purple" />
                </div>
                <p className="font-bold text-gray-900">ادفع ببطاقة الائتمان</p>
                <Button
                  onClick={() => { setShowPaymentModal(false); handlePublish(); }}
                  disabled={publishing}
                  className="w-full rounded-xl font-bold text-white primary-gradient border-0"
                >
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'دفع بالبطاقة'}
                </Button>
              </CardContent>
            </Card>

            {/* CliQ option */}
            <Card className="flex-1 border border-green-200 rounded-2xl">
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-xl bg-green-50">
                  <MessageCircle className="h-7 w-7 text-green-600" />
                </div>
                <p className="font-bold text-gray-900">ادفع عبر CliQ</p>
                <div className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm text-right space-y-1">
                  <p className="text-gray-500 text-xs">اسم المستخدم</p>
                  <p className="font-bold text-gray-900 text-base">{cliqUsername ?? '...'}</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  قم بتحويل 5 دنانير أردنية إلى الحساب أعلاه ثم أرسل لنا صورة الإيصال عبر واتساب
                </p>
                <a
                  href="https://wa.me/962799126390?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%AA%D9%81%D8%B9%D9%8A%D9%84%20%D9%85%D8%AA%D8%AC%D8%B1%D9%8A%20%D9%88%D9%82%D8%AF%20%D8%AF%D9%81%D8%B9%D8%AA%20%D8%B9%D8%A8%D8%B1%20CliQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full rounded-xl font-bold bg-[#25D366] hover:bg-[#20BD5A] text-white border-0 gap-2">
                    <MessageCircle className="h-4 w-4" />
                    أرسل الإيصال عبر واتساب
                  </Button>
                </a>
                <p className="text-xs text-gray-400">سيتم تفعيل متجرك خلال 24 ساعة بعد التحقق من الدفع</p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview button — shown only when store is not yet active */}
      {!profile.is_active && user && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/preview/${user.id}`, '_blank')}
          className="w-full rounded-xl border-brand-purple/30 text-brand-purple hover:bg-brand-purple/5 font-semibold"
        >
          <ExternalLink className="h-4 w-4 ml-2" />
          معاينة متجري
        </Button>
      )}

      {/* Cover upload */}
      <div className="space-y-2">
        <Label className="font-semibold">صورة الغلاف</Label>
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 group cursor-pointer bg-gray-50">
          {profile.cover_url
            ? <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-purple to-brand-cyan"><ImageIcon className="h-10 w-10 text-white/50" /></div>}
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <span className="text-white text-sm font-bold flex items-center gap-2"><Camera className="h-5 w-5" />تغيير الغلاف</span>
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Avatar + Store Name */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gray-100">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center bg-gray-200"><Camera className="h-8 w-8 text-gray-400" /></div>}
          </div>
          <label className="absolute -bottom-1 -right-1 bg-brand-purple text-white rounded-full p-1.5 cursor-pointer shadow-md">
            <Camera className="h-3.5 w-3.5" />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>
        <div className="flex-1 space-y-2">
          <Label className="font-semibold">اسم المتجر</Label>
          <Input
            value={profile.store_name || ''}
            onChange={e => setProfile(prev => ({ ...prev, store_name: e.target.value }))}
            placeholder="مثال: رنا ستورز"
            className="h-11 rounded-xl"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="font-semibold flex items-center justify-between">
          <span>وصف المتجر</span>
          <span className={`text-xs font-normal ${charCount > 90 ? 'text-red-500' : 'text-gray-400'}`}>{charCount}/100 — الحد الأقصى 100 حرف</span>
        </Label>
        <Textarea
          value={profile.store_description || ''}
          onChange={e => {
            const val = e.target.value.slice(0, 100);
            setProfile(prev => ({ ...prev, store_description: val }));
            setCharCount(val.length);
          }}
          placeholder="وصف مختصر عن متجرك..."
          className="rounded-xl resize-none"
          rows={3}
          maxLength={100}
        />
      </div>

      {/* WhatsApp */}
      <div className="space-y-2">
        <Label className="font-semibold">رقم واتساب للطلبات</Label>
        <Input
          value={profile.whatsapp_number || ''}
          onChange={e => setProfile(prev => ({ ...prev, whatsapp_number: e.target.value.replace(/\D/g, '') }))}
          placeholder="مثال: 966XXXXXXXXX أو 962XXXXXXXXX"
          className="h-11 rounded-xl"
          dir="ltr"
          inputMode="numeric"
        />
        <p className="text-xs text-gray-400">أدخل رقمك الكامل مع رمز الدولة بدون + (مثال: 966501234567)</p>
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label className="font-semibold">رابط المتجر (slug)</Label>
        <Input
          value={profile.page_slug || ''}
          onChange={e => setProfile(prev => ({ ...prev, page_slug: slugifyLatin(e.target.value) }))}
          placeholder="my-store-name"
          className="h-11 rounded-xl"
          dir="ltr"
        />
        <p className="text-xs text-gray-400">حروف لاتينية وأرقام وشرطات فقط. يُحدَّث الرابط في قاعدة البيانات عند الضغط على «حفظ التغييرات».</p>
        {!profile.is_active && (
          <p className="text-xs text-amber-600 font-medium">تغيير الرابط لن ينشر متجرك — يجب إتمام الدفع أولاً</p>
        )}
      </div>

      {/* Shareable link */}
      {profile.page_slug && !!profile.is_active && (
        <Card className="border border-brand-purple/20 bg-brand-purple/5 rounded-2xl">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-brand-purple mb-2">رابط متجرك القابل للمشاركة</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border rounded-lg px-3 py-2 text-gray-600 overflow-x-auto" dir="ltr">{storeLink}</code>
              <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0 rounded-xl border-brand-purple/30 hover:bg-brand-purple/10">
                {copied ? <Check className="h-4 w-4 text-brand-purple" /> : <Copy className="h-4 w-4 text-brand-purple" />}
              </Button>
              <a href={storeLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" className="shrink-0 rounded-xl border-brand-purple/30 hover:bg-brand-purple/10">
                  <ExternalLink className="h-4 w-4 text-brand-purple" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleSave}
        disabled={saving || uploading}
        className="w-full h-12 font-bold text-base rounded-xl text-white bg-gradient-to-br from-brand-purple to-brand-cyan hover:opacity-95"
      >
        {saving ? <><Loader2 className="h-5 w-5 animate-spin ml-2" />جاري الحفظ...</> : 'حفظ التغييرات'}
      </Button>

      {/* Delete Account */}
      <div className="pt-4 border-t border-gray-100">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-400 rounded-xl">
              <Trash2 className="h-4 w-4 ml-2" />حذف الحساب
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>حذف الحساب</AlertDialogTitle>
              <AlertDialogDescription>هل أنت متأكد من حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء وستُحذف جميع بياناتك.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">نعم، احذف</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default StoreSettingsForm;
