import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const sendWhatsApp = async (to: string, message: string) => {
  try {
    console.log('📲 Sending WhatsApp to:', to, 'message:', message.substring(0, 50));
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: { to, message },
    });
    console.log('📲 WhatsApp response:', JSON.stringify(data), 'error:', error);
    if (error) {
      console.error('WhatsApp send error:', error);
      toast.error('فشل إرسال واتساب للعميل');
      return null;
    }
    if (data && !data.success) {
      console.error('WhatsApp API error:', data.error);
      toast.error('فشل إرسال واتساب: ' + (data.error || 'خطأ غير معروف'));
      return null;
    }
    toast.success('تم إرسال واتساب للعميل بنجاح ✅');
    return data;
  } catch (e) {
    console.error('WhatsApp send failed:', e);
    toast.error('فشل إرسال واتساب للعميل');
    return null;
  }
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, MapPin, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyRequest {
  id: string;
  customer_id: string;
  service_type: string;
  governorate: string;
  status: string;
  accepted_by: string | null;
  customer_phone: string;
  customer_name: string;
  created_at: string;
}

const EmergencyOrders = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [providerInfo, setProviderInfo] = useState<{ category: string; governorate: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchProviderInfo();
  }, [user]);

  useEffect(() => {
    if (!providerInfo) return;
    fetchRequests();

    // Realtime subscription
    const channel = supabase
      .channel('emergency-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'emergency_requests',
      }, (payload: any) => {
        if (
          payload.new?.service_type === providerInfo.category &&
          payload.new?.governorate === providerInfo.governorate &&
          payload.new?.status === 'pending'
        ) {
          playAlertSound();
          triggerVibration();
          // Send in-app notification to provider
          if (user) {
            supabase.from('notifications').insert({
              user_id: user.id,
              title: '🚨 طلب طوارئ جديد!',
              message: `طلب ${payload.new.service_type} جديد في ${payload.new.governorate}`,
              type: 'emergency_new',
            }).then(() => {});
          }
        }
        fetchRequests();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'emergency_requests',
      }, () => {
        fetchRequests();
      })
      .subscribe();

    // Polling fallback every 15 seconds
    const pollInterval = setInterval(fetchRequests, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [providerInfo]);

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      [0, 0.25, 0.5].forEach(delay => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        osc.type = 'square';
        gain.gain.value = 0.3;
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.15);
      });
    } catch (e) {
      console.warn('Audio alert failed:', e);
    }
  };

  const triggerVibration = () => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (e) {
      console.warn('Vibration failed:', e);
    }
  };

  const fetchProviderInfo = async () => {
    if (!user) return;
    // Try profiles table first (service_location column), fallback to user_metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('category, service_location')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const category = profile?.category || user.user_metadata?.category || '';
    const governorate = profile?.service_location || user.user_metadata?.address || '';
    console.log('Provider info:', { category, governorate, fromProfile: !!profile });
    setProviderInfo({ category, governorate });
    setLoading(false);
  };

  const fetchRequests = async () => {
    if (!providerInfo || !user) return;
    
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    // Auto-delete expired pending requests (older than 2 hours)
    await supabase
      .from('emergency_requests')
      .delete()
      .eq('status', 'pending')
      .lt('created_at', twoHoursAgo);

    // Also cleanup old completed/accepted requests older than 2 hours
    await supabase
      .from('emergency_requests')
      .delete()
      .in('status', ['completed', 'accepted', 'in_progress'])
      .lt('created_at', twoHoursAgo);
    
    // Only show requests matching exact category + governorate
    const { data: pending } = await supabase
      .from('emergency_requests')
      .select('*')
      .eq('status', 'pending')
      .eq('service_type', providerInfo.category)
      .eq('governorate', providerInfo.governorate)
      .gt('created_at', twoHoursAgo)
      .order('created_at', { ascending: false });

    setRequests((pending || []).filter((r: any) => !completedIds.has(r.id)) as EmergencyRequest[]);

    const { data: accepted } = await supabase
      .from('emergency_requests')
      .select('*')
      .in('status', ['accepted', 'in_progress'])
      .eq('accepted_by', user.id)
      .order('created_at', { ascending: false });

    setAcceptedRequests((accepted || []).filter((r: any) => !completedIds.has(r.id)) as EmergencyRequest[]);
  };

  const handleAccept = async (requestId: string) => {
    if (!user || accepting) return;
    setAccepting(requestId);

    // First check if still pending
    const { data: check } = await supabase
      .from('emergency_requests')
      .select('status')
      .eq('id', requestId)
      .single();

    if (check?.status !== 'pending') {
      toast.error('تم قبول هذا الطلب من مزود آخر');
      setAccepting(null);
      fetchRequests();
      return;
    }

    const { error } = await supabase
      .from('emergency_requests')
      .update({ status: 'accepted', accepted_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (error) {
      console.error('Accept error:', error);
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        toast.error('خطأ في الصلاحيات - تواصل مع الدعم الفني');
      } else {
        toast.error('تم قبول هذا الطلب من مزود آخر');
      }
      setAccepting(null);
      fetchRequests();
      return;
    }

    // Send notification to customer
    const { data: req } = await supabase
      .from('emergency_requests')
      .select('customer_id, service_type')
      .eq('id', requestId)
      .single();

    if (req) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, phone')
        .eq('user_id', user.id)
        .maybeSingle();

      const providerName = profile?.display_name || 'مزود خدمة';
      const providerPhone = profile?.phone || 'غير متوفر';
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: req.customer_id,
        title: '✅ تم قبول طلبك الطارئ!',
        message: `${providerName} وافق على طلبك (${req.service_type}).\nرقم مزود الخدمة: ${providerPhone}\nترقّب اتصال هاتفي أو رسالة واتساب قريباً.`,
        type: 'emergency_accepted',
      });
      if (notifError) console.error('Failed to send acceptance notification:', notifError);

      // Send WhatsApp to customer automatically via UltraMsg
      const { data: customerData, error: custError } = await supabase
        .from('customer_profiles')
        .select('phone')
        .eq('user_id', req.customer_id)
        .maybeSingle();

      console.log('Customer data for WhatsApp:', { customerData, custError, customerId: req.customer_id });

      if (customerData?.phone) {
        const providerName = profile?.display_name || 'مزود خدمة';
        const providerPhone = profile?.phone || '';
        const waMessage = `✅ تم قبول طلبك الطارئ!\n\nمزود الخدمة: ${providerName}\nرقم التواصل: ${providerPhone}\nنوع الخدمة: ${req.service_type}\n\nسيتواصل معك قريباً.`;
        console.log('Sending WhatsApp to:', customerData.phone);
        const waResult = await sendWhatsApp(customerData.phone, waMessage);
        console.log('WhatsApp result:', waResult);
      } else {
        console.warn('No phone found for customer:', req.customer_id);
        toast.info('لم يتم إرسال واتساب - رقم العميل غير متوفر');
      }
    }

    toast.success('تم قبول الطلب بنجاح!');
    setAccepting(null);
    fetchRequests();
  };

  const handleComplete = async (requestId: string) => {
    if (!user) return;
    
    // Immediately remove from UI
    setAcceptedRequests(prev => prev.filter(r => r.id !== requestId));
    setCompletedIds(prev => new Set(prev).add(requestId));

    // Get request info before deleting
    const { data: req } = await supabase
      .from('emergency_requests')
      .select('customer_id, service_type')
      .eq('id', requestId)
      .maybeSingle();

    // Try delete first, fallback to update
    const { error: deleteError } = await supabase
      .from('emergency_requests')
      .delete()
      .eq('id', requestId)
      .eq('accepted_by', user.id);

    if (deleteError) {
      console.warn('Delete failed, trying update:', deleteError);
      const { error: updateError } = await supabase
        .from('emergency_requests')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('accepted_by', user.id);
      
      if (updateError) {
        console.error('Complete error:', updateError);
        // Keep hidden via completedIds even if DB op failed
      }
    }

    // Send notification to customer
    if (req) {
      await supabase.from('notifications').insert({
        user_id: req.customer_id,
        title: '✅ تم إنهاء طلبك',
        message: `تم إنهاء خدمة ${req.service_type} بنجاح. شكراً لاستخدامك خدماتنا!`,
        type: 'emergency_completed',
      });
    }

    toast.success('تم إنهاء الطلب بنجاح!');
  };

  const formatTime = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diff < 1) return 'الآن';
    if (diff < 60) return `منذ ${diff} دقيقة`;
    return `منذ ${Math.floor(diff / 60)} ساعة`;
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            طلبات طارئة ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد طلبات طارئة حالياً</p>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="border-2 border-destructive/30 rounded-xl p-4 bg-destructive/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive">{req.service_type}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatTime(req.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{req.governorate}</span>
                  </div>
                  <p className="text-sm font-medium">{req.customer_name || 'عميل'}</p>
                  <Button
                    onClick={() => handleAccept(req.id)}
                    disabled={accepting !== null}
                    className="w-full bg-success hover:bg-success/90 text-success-foreground font-bold"
                  >
                    {accepting === req.id ? '⏳ جاري القبول...' : '✅ موافق - قبول الطلب'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {acceptedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>طلبات مقبولة ({acceptedRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {acceptedRequests.map(req => (
                <div key={req.id} className="border rounded-xl p-4 bg-success/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-success text-success-foreground">{req.service_type}</Badge>
                    <span className="text-xs text-muted-foreground">{formatTime(req.created_at)}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">{req.customer_name || 'عميل'}</p>
                    <p className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3" /> {req.governorate}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${req.customer_phone}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 font-bold text-sm"
                    >
                      <Phone className="h-4 w-4" /> اتصال
                    </a>
                    <a
                      href={`https://wa.me/${req.customer_phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-lg py-2 font-bold text-sm"
                    >
                      <MessageCircle className="h-4 w-4" /> واتساب
                    </a>
                  </div>
                  {req.status === 'accepted' && (
                    <Button
                      onClick={() => handleComplete(req.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold mt-2"
                    >
                      <CheckCircle2 className="h-4 w-4 ml-2" />
                      ✅ تم إنهاء الطلب
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmergencyOrders;
