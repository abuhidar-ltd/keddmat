import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { ALL_CATEGORIES, EMERGENCY_CATEGORIES, getSubcategories } from '@/lib/categoryIcons';
import { GOVERNORATES } from '@/lib/governorates';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, MessageCircle, ArrowRight, Loader2, Phone as PhoneIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProviderProfile {
  user_id: string;
  display_name: string;
  store_name: string | null;
  page_slug: string;
  avatar_url: string | null;
  service_location: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  category: string;
  emergency_mode?: boolean | null;
  subcategories: string[] | null;
}

const normalizeArabicText = (value: string | null) => {
  return (value || '')
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const matchesGovernorate = (serviceLocation: string | null, governorate: string) => {
  const normalizedLocation = normalizeArabicText(serviceLocation);
  const normalizedGovernorate = normalizeArabicText(governorate);

  if (!normalizedLocation || !normalizedGovernorate) return false;

  const locationParts = normalizedLocation
    .split(/[،,\-/|]/)
    .map(part => part.trim())
    .filter(Boolean);

  return locationParts.some(part => part === normalizedGovernorate || part.includes(normalizedGovernorate));
};

const EmergencyRequestModal = ({ open, onOpenChange }: Props) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [step, setStep] = useState<'category' | 'subcategory' | 'governorate' | 'providers'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const emergencyServices = ALL_CATEGORIES.filter(svc => EMERGENCY_CATEGORIES.includes(svc.category));

  useEffect(() => {
    if (!open) {
      setStep('category');
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSelectedGovernorate(null);
      setProviders([]);
    }
  }, [open]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const subs = getSubcategories(category);
    if (subs.length > 0) {
      setStep('subcategory');
    } else {
      setStep('governorate');
    }
  };

  const handleSubcategorySelect = (subcategory: string | null) => {
    setSelectedSubcategory(subcategory);
    setStep('governorate');
  };

  const handleGovernorateSelect = async (governorate: string) => {
    if (!selectedCategory) return;

    setSelectedGovernorate(governorate);
    setStep('providers');
    setLoading(true);

    let query = supabase
      .from('profiles')
      .select('user_id, display_name, store_name, page_slug, avatar_url, service_location, phone, whatsapp_number, category, emergency_mode, subcategories')
      .eq('category', selectedCategory)
      .eq('page_enabled', true);

    if (selectedSubcategory) {
      query = query.contains('subcategories', [selectedSubcategory]);
    }

    const { data, error } = await query;

    if (error || !data) {
      setProviders([]);
      setLoading(false);
      return;
    }

    const filtered = data.filter((provider) => matchesGovernorate(provider.service_location, governorate));

    // Fetch ratings for filtered providers
    const providerIds = filtered.map(p => p.user_id);
    let ratingsMap: Record<string, number> = {};
    if (providerIds.length > 0) {
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('merchant_id, rating')
        .in('merchant_id', providerIds);
      
      if (ratingsData) {
        const ratingsSums: Record<string, { sum: number; count: number }> = {};
        for (const r of ratingsData) {
          if (!ratingsSums[r.merchant_id]) ratingsSums[r.merchant_id] = { sum: 0, count: 0 };
          ratingsSums[r.merchant_id].sum += r.rating;
          ratingsSums[r.merchant_id].count += 1;
        }
        for (const [id, val] of Object.entries(ratingsSums)) {
          ratingsMap[id] = val.sum / val.count;
        }
      }
    }

    const rankedProviders = filtered
      .map(p => ({ ...p, avg_rating: ratingsMap[p.user_id] || 0 }));

    // Shuffle providers randomly so order changes on every fetch
    for (let i = rankedProviders.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rankedProviders[i], rankedProviders[j]] = [rankedProviders[j], rankedProviders[i]];
    }

    setProviders(rankedProviders);
    setLoading(false);
  };

  const trackClick = async (merchantId: string, clickType: 'whatsapp' | 'phone') => {
    // Use direct fetch with keepalive so the request completes even if the page navigates away
    const SUPABASE_URL = 'https://fooqrkdniswrzwgcytne.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvb3Fya2RuaXN3cnp3Z2N5dG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mzg5MTMsImV4cCI6MjA4ODMxNDkxM30.px0ExibFbOMoNBw-emojn6k3UbrHsZSda4oFTWPpOis';
    try {
      console.log('[emergency_clicks] inserting', { merchantId, clickType });
      const res = await fetch(`${SUPABASE_URL}/rest/v1/emergency_clicks`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ merchant_id: merchantId, click_type: clickType }),
        keepalive: true,
      });
      console.log('[emergency_clicks] response', res.status);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('emergency_clicks insert failed:', res.status, body);
        toast.error(isAr ? `⚠️ فشل تسجيل التنبيه (${res.status})` : `⚠️ Alert tracking failed (${res.status})`, {
          description: body.slice(0, 120),
        });
        return false;
      }
      toast.success(isAr ? '✅ تم إرسال التنبيه' : '✅ Alert sent successfully');
      return true;
    } catch (e: any) {
      console.error('emergency_clicks insert exception:', e);
      toast.error(isAr ? '⚠️ فشل تسجيل التنبيه' : '⚠️ Alert tracking failed', {
        description: e?.message,
      });
      return false;
    }
  };

  const handleWhatsAppClick = (provider: ProviderProfile) => {
    const phone = provider.whatsapp_number || provider.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('962') ? cleanPhone : `962${cleanPhone.replace(/^0/, '')}`;
    const message = encodeURIComponent('مرحبا أنا عميل من خدمات\n\nأحتاج صيانة طارئة');
    const whatsappUrl = `https://wa.me/${fullPhone}?text=${message}`;

    if (!cleanPhone) return;

    // Open WhatsApp synchronously so the browser doesn't block the popup
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    // Track + notify in the background (non-blocking)
    trackClick(provider.user_id, 'whatsapp');
    try {
      void supabase.functions.invoke('send-whatsapp', {
        body: { to: fullPhone, message: 'مرحبا، أنا عميل من موقع خدمات أرغب بالتواصل معك - طلب طوارئ' },
      });
    } catch (e) { /* silent */ }
  };

  const handlePhoneClick = async (provider: ProviderProfile) => {
    const phone = provider.phone || provider.whatsapp_number || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('962') ? cleanPhone : `962${cleanPhone.replace(/^0/, '')}`;

    if (!cleanPhone) return;

    await trackClick(provider.user_id, 'phone');

    // Small delay so user sees the toast before navigation
    setTimeout(() => {
      window.location.href = `tel:+${fullPhone}`;
    }, 600);
  };

  const goBack = () => {
    if (step === 'providers') { setStep('governorate'); setProviders([]); }
    else if (step === 'governorate') {
      const subs = selectedCategory ? getSubcategories(selectedCategory) : [];
      if (subs.length > 0) { setStep('subcategory'); }
      else { setStep('category'); setSelectedCategory(null); }
    }
    else if (step === 'subcategory') { setStep('category'); setSelectedCategory(null); setSelectedSubcategory(null); }
  };

  const categoryInfo = selectedCategory ? emergencyServices.find(s => s.category === selectedCategory) : null;
  const CategoryIcon = categoryInfo?.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            🚨 {isAr ? 'اطلب صيانة طارئة' : 'Request Emergency Maintenance'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 'category' && (isAr ? 'اختر نوع الصيانة الطارئة' : 'Choose the emergency maintenance type')}
            {step === 'subcategory' && (isAr ? 'اختر التخصص' : 'Choose the specialty')}
            {step === 'governorate' && (isAr ? 'اختر المحافظة' : 'Choose the governorate')}
            {step === 'providers' && (isAr ? `مزودو ${selectedCategory} في ${selectedGovernorate}` : `${selectedCategory} providers in ${selectedGovernorate}`)}
          </DialogDescription>
        </DialogHeader>

        {step !== 'category' && (
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-primary hover:underline mb-2">
            <ArrowRight className="h-4 w-4" />
            {isAr ? 'رجوع' : 'Back'}
          </button>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Categories */}
          {step === 'category' && (
            <div className="grid grid-cols-3 gap-2 py-2">
              {emergencyServices.map((svc) => (
                <button
                  key={svc.category}
                  onClick={() => handleCategorySelect(svc.category)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-border hover:border-destructive/50 transition-all"
                >
                  <svc.icon className="h-7 w-7 text-muted-foreground" />
                  <span className="text-xs font-bold text-center leading-tight">
                    {isAr ? svc.category : svc.labelKey.split('.').pop()}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Step 1.5: Subcategories */}
          {step === 'subcategory' && selectedCategory && (
            <div className="grid grid-cols-2 gap-2 py-2">
              {getSubcategories(selectedCategory).map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubcategorySelect(sub.id)}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 border-border hover:border-destructive/50 transition-all"
                >
                  <span className="text-sm font-bold text-center">{isAr ? sub.labelAr : sub.labelEn}</span>
                </button>
              ))}
              <button
                onClick={() => handleSubcategorySelect(null)}
                className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all"
              >
                {isAr ? 'عرض الكل' : 'View All'}
              </button>
            </div>
          )}

          {/* Step 2: Governorates */}
          {step === 'governorate' && (
            <div className="grid grid-cols-2 gap-2 py-2">
              {GOVERNORATES.map((gov) => (
                <button
                  key={gov.value}
                  onClick={() => handleGovernorateSelect(gov.value)}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 border-border hover:border-destructive/50 transition-all"
                >
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-bold">{isAr ? gov.labelAr : gov.labelEn}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Providers */}
          {step === 'providers' && (
            <div className="py-2">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : providers.length === 0 ? (
                <div className="text-center py-12">
                  {CategoryIcon && <CategoryIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />}
                  <p className="font-semibold">{isAr ? 'لا يوجد مزودو خدمة لهذا التصنيف حالياً' : 'No providers available for this category'}</p>
                  <p className="text-sm text-muted-foreground mt-1">{isAr ? 'جرّب تصنيفاً آخر' : 'Try another category'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {providers.map((provider) => (
                    <Card key={provider.user_id} className="overflow-hidden">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="w-14 h-14 border-2 border-primary/20 shrink-0">
                          {provider.avatar_url ? (
                            <AvatarImage src={provider.avatar_url} alt={provider.display_name} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10">
                            {CategoryIcon && <CategoryIcon className="h-6 w-6 text-primary" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm truncate">{provider.store_name || provider.display_name}</h3>
                          {provider.service_location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{provider.service_location}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handlePhoneClick(provider)}
                            className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground px-2.5 py-2 rounded-lg text-xs font-bold transition-colors"
                          >
                            <PhoneIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleWhatsAppClick(provider)}
                            className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20BD5A] text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyRequestModal;
