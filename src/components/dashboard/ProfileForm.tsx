import { useState, useEffect, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useNativeImagePicker } from '@/hooks/useNativeImagePicker';
import { Loader2, Copy, ExternalLink, Camera, ImagePlus, X } from 'lucide-react';
import PhoneInput from '@/components/PhoneInput';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_CATEGORIES, isEmergencyCategory } from '@/lib/categoryIcons';

interface Profile {
  id: string; display_name: string | null; bio: string | null; phone: string;
  whatsapp_number: string | null; has_delivery: boolean; page_enabled: boolean;
  page_slug: string | null; avatar_url: string | null; cover_url: string | null;
  service_location: string | null; working_hours: string | null;
  store_name: string | null; emergency_mode: boolean; category: string | null;
}

const ProfileForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { uploadImage, uploading, deleteImage } = useImageUpload({ maxWidth: 1200, maxHeight: 600, quality: 0.8 });
  const { pickImage, isNative } = useNativeImagePicker();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) fetchProfile(); }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (error) toast({ title: t('profile.error'), description: t('profile.loadError'), variant: 'destructive' });
    else setProfile(data as Profile);
    setLoading(false);
  };

  const processAvatarFile = async (file: File) => {
    if (!user || !profile) return;
    if (profile.avatar_url) await deleteImage(profile.avatar_url);
    const url = await uploadImage(file, user.id, 'avatars');
    if (url) { setProfile({ ...profile, avatar_url: url }); await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id); toast({ title: t('profile.imageUploaded') }); }
  };

  const processCoverFile = async (file: File) => {
    if (!user || !profile) return;
    if (profile.cover_url) await deleteImage(profile.cover_url);
    const url = await uploadImage(file, user.id, 'covers');
    if (url) { setProfile({ ...profile, cover_url: url }); await supabase.from('profiles').update({ cover_url: url }).eq('user_id', user.id); toast({ title: t('profile.imageUploaded') }); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) await processAvatarFile(file); };
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) await processCoverFile(file); };
  const handleNativeAvatarPick = async () => { try { const file = await pickImage(avatarInputRef); if (file) await processAvatarFile(file); } catch (err: any) { toast({ title: 'خطأ', description: err.message, variant: 'destructive' }); } };
  const handleNativeCoverPick = async () => { try { const file = await pickImage(coverInputRef); if (file) await processCoverFile(file); } catch (err: any) { toast({ title: 'خطأ', description: err.message, variant: 'destructive' }); } };

  const removeAvatar = async () => { if (!user || !profile?.avatar_url) return; await deleteImage(profile.avatar_url); setProfile({ ...profile, avatar_url: null }); await supabase.from('profiles').update({ avatar_url: null }).eq('user_id', user.id); };
  const removeCover = async () => { if (!user || !profile?.cover_url) return; await deleteImage(profile.cover_url); setProfile({ ...profile, cover_url: null }); await supabase.from('profiles').update({ cover_url: null }).eq('user_id', user.id); };

  const handleSave = async () => {
    if (!profile || !user) return;
    if (!profile.whatsapp_number?.trim()) { toast({ title: t('profile.error'), description: t('profile.whatsappRequired'), variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: profile.display_name, bio: profile.bio, whatsapp_number: profile.whatsapp_number,
      has_delivery: profile.has_delivery, page_enabled: true, page_slug: profile.page_slug,
      service_location: (profile as any).service_location, working_hours: (profile as any).working_hours,
      store_name: (profile as any).store_name, emergency_mode: profile.emergency_mode,
    }).eq('user_id', user.id);
    setSaving(false);
    if (error) toast({ title: t('profile.error'), description: t('profile.saveError'), variant: 'destructive' });
    else toast({ title: t('profile.saved'), description: t('profile.profileUpdated') });
  };

  const copyPageLink = () => { if (profile?.page_slug) { navigator.clipboard.writeText(`${window.location.origin}/p/${profile.page_slug}`); toast({ title: t('profile.linkCopied') }); } };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!profile) return <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">{t('profile.notFound')}</p></CardContent></Card>;

  return (
    <div className="space-y-6">
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
      <Card className="overflow-hidden">
        <CardHeader className="p-0">
          <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20">
            {profile.cover_url ? <img src={profile.cover_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImagePlus className="h-12 w-12 opacity-50" /></div>}
            <div className="absolute top-2 start-2 flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleNativeCoverPick} disabled={uploading} className="shadow-lg">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}<span className="mx-1">{t('profile.changeCover')}</span></Button>
              {profile.cover_url && <Button size="icon" variant="destructive" onClick={removeCover} className="shadow-lg h-8 w-8"><X className="h-4 w-4" /></Button>}
            </div>
            <div className="absolute -bottom-12 end-6">
              <div className="relative">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-2xl object-cover border-4 border-background shadow-xl" /> : <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center"><span className="text-4xl">👤</span></div>}
                <Button size="icon" variant="secondary" onClick={handleNativeAvatarPick} disabled={uploading} className="absolute -bottom-2 -start-2 h-8 w-8 rounded-full shadow-lg">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}</Button>
                {profile.avatar_url && <Button size="icon" variant="destructive" onClick={removeAvatar} className="absolute -top-2 -start-2 h-6 w-6 rounded-full shadow-lg"><X className="h-3 w-3" /></Button>}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-16 pb-6"><p className="text-sm text-muted-foreground">{t('profile.imagesNote')}</p></CardContent>
      </Card>

      {profile.page_slug && (
        <Card>
          <CardHeader><CardTitle>{t('profile.pageLink')}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
              <span className="text-sm flex-1 truncate">{window.location.origin}/p/{profile.page_slug}</span>
              <Button size="icon" variant="ghost" onClick={copyPageLink}><Copy className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" asChild><a href={`/p/${profile.page_slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{t('profile.profileInfo')}</CardTitle><CardDescription>{t('profile.profileInfoDesc')}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store_name">{t('profile.storeName')}</Label>
            <Input id="store_name" placeholder={t('profile.storeNamePlaceholder')} value={(profile as any).store_name || ''} onChange={(e) => setProfile({ ...profile, store_name: e.target.value } as any)} maxLength={100} />
          </div>
          <div className="space-y-2"><Label htmlFor="bio">{t('profile.bio')}</Label><Textarea id="bio" placeholder={t('profile.bioPlaceholder')} value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} maxLength={500} /></div>
          <div className="space-y-2"><Label htmlFor="service_location">{t('profile.serviceLocation')}</Label><Input id="service_location" value="عمّان" disabled className="bg-muted" /></div>
          <div className="space-y-2"><Label htmlFor="working_hours">{t('profile.workingHours')}</Label><Input id="working_hours" placeholder={t('profile.workingHoursPlaceholder')} value={(profile as any).working_hours || ''} onChange={(e) => setProfile({ ...profile, working_hours: e.target.value } as any)} maxLength={200} /></div>
          {isEmergencyCategory(profile.category || '') && (
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <Label htmlFor="emergency_mode" className="cursor-pointer font-bold">🚨 {language === 'ar' ? 'تفعيل خدمة الصيانة الطارئة (24)' : 'Enable Emergency Service (24h)'}</Label>
              <Switch id="emergency_mode" checked={profile.emergency_mode || false} onCheckedChange={(checked) => setProfile({ ...profile, emergency_mode: checked })} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('profile.contactInfo')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label htmlFor="phone">{t('profile.phone')}</Label><Input id="phone" value={profile.phone} disabled className="bg-muted" /><p className="text-xs text-muted-foreground">{t('profile.phoneCantChange')}</p></div>
          <div className="space-y-2"><Label htmlFor="whatsapp">{t('profile.whatsapp')}</Label><PhoneInput id="whatsapp" placeholder="5XX XXX XXX" value={profile.whatsapp_number || ''} onChange={(value) => setProfile({ ...profile, whatsapp_number: value })} /></div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-success hover:bg-success/90 text-success-foreground">
        {saving ? <><Loader2 className="mx-2 h-4 w-4 animate-spin" />{t('profile.saving')}</> : t('profile.saveChanges')}
      </Button>
    </div>
  );
};

export default ProfileForm;
