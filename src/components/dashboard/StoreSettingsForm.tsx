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
import PhoneInput from '@/components/PhoneInput';
import PaymentModal from './PaymentModal';
import { Copy, Check, Loader2, Camera, Image as ImageIcon, Trash2, ExternalLink } from 'lucide-react';
import type { Profile } from '@/types/keddmat';
import { getPublicSiteUrl } from '@/lib/siteUrl';
import { slugifyLatin, generateSlug } from '@/lib/slug';
import { daysUntilExpiry, isPublicStoreVisible, SUBSCRIPTION_PERIOD_DAYS } from '@/lib/subscription';

const StoreSettingsForm = () => {
  const { user, signOut } = useAuth();
  const { uploadImage, uploading } = useImageUpload();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  // Auto-populate slug from store name while slug is still unset
  useEffect(() => {
    if (!profile.page_slug && profile.store_name) {
      setProfile(prev => ({ ...prev, page_slug: generateSlug(profile.store_name || '') }));
    }
  }, [profile.store_name]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle();
    if (data) {
      setProfile(data as Profile);
      setCharCount((data as Profile).store_description?.length || 0);
    }
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
    await supabase.from('profiles').delete().eq('user_id', user.id);
    await supabase.auth.admin.deleteUser(user.id).catch(() => {});
    await signOut();
    window.location.href = '/';
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-purple" /></div>;

  const storeLink = `${getPublicSiteUrl()}/store/${profile.page_slug || ''}`;
  const publicVisible = isPublicStoreVisible({
    is_active: !!profile.is_active,
    subscription_expires_at: profile.subscription_expires_at,
  });
  const daysLeft = daysUntilExpiry(profile.subscription_expires_at);
  const expiryLabel = profile.subscription_expires_at
    ? new Date(profile.subscription_expires_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })
    : null;

  return (
    <div className="space-y-6 p-1">
      {/* Store Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border">
        <div>
          <p className="font-semibold text-gray-800">حالة المتجر</p>
          {publicVisible ? (
            <>
              <p className="text-sm text-gray-500">متجرك منشور ويظهر للزوار</p>
              {expiryLabel && (
                <p className="text-xs text-brand-purple font-medium mt-1">ينتهي الاشتراك: {expiryLabel}</p>
              )}
              {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
                <p className="text-xs text-amber-700 mt-1">تبقّى {daysLeft} يوماً — جدّد مبكراً بعيد انقطاع الرابط العام.</p>
              )}
              <p className="text-xs text-gray-400 mt-1">الاشتراك شهري ({SUBSCRIPTION_PERIOD_DAYS} يوماً) بعد كل دفعة يوافق عليها فريقنا.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                {profile.subscription_expires_at && new Date(profile.subscription_expires_at) <= new Date()
                  ? 'انتهت صلاحية اشتراكك — المتجر غير ظاهر للزوار حالياً'
                  : 'متجرك غير منشور للعامة بعد'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ادفع عبر CliQ، ارفع الوصل، وبعد الموافقة يُمدَّد اشتراكك {SUBSCRIPTION_PERIOD_DAYS} يوماً (أو يُفعَّل لأول مرة).
              </p>
            </>
          )}
        </div>
        {publicVisible
          ? <Badge className="bg-gradient-to-r from-brand-cyan to-brand-purple text-white text-sm px-3 py-1 border-0">متجرك نشط ✓</Badge>
          : <Button onClick={() => setShowPayment(true)} className="font-bold text-white bg-gradient-to-br from-brand-cyan to-brand-purple hover:opacity-95">انشر متجرك / تجديد</Button>}
      </div>

      {/* Cover upload */}
      <div className="space-y-2">
        <Label className="font-semibold">صورة الغلاف</Label>
        <div className="relative h-32 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 group cursor-pointer bg-gray-50">
          {profile.cover_url
            ? <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-cyan to-brand-purple"><ImageIcon className="h-10 w-10 text-white/50" /></div>}
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
        <PhoneInput
          value={profile.whatsapp_number || ''}
          onChange={val => setProfile(prev => ({ ...prev, whatsapp_number: val }))}
          placeholder="7XX XXX XXX"
        />
        <p className="text-xs text-gray-400">هذا الرقم يستخدمه الزوار لإرسال الطلبات عبر واتساب</p>
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
        <p className="text-xs text-gray-400">حروف لاتينية وأرقام وشرطات فقط. يُحدَّث الرابط في قاعدة البيانات عند الضغط على «حفظ التغييرات».</p>
      </div>

      {/* Shareable link */}
      {profile.page_slug && publicVisible && (
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
        className="w-full h-12 font-bold text-base rounded-xl text-white bg-gradient-to-br from-brand-cyan to-brand-purple hover:opacity-95"
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

      <PaymentModal
        open={showPayment}
        onOpenChange={(open) => {
          setShowPayment(open);
          if (!open && user) fetchProfile();
        }}
      />
    </div>
  );
};

export default StoreSettingsForm;
