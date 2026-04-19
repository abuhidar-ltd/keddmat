import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, CreditCard, CheckCircle, XCircle, Clock, Loader2, FileImage, Info, Calendar, Gift, Sparkles } from 'lucide-react';

interface PaymentReceipt { id: string; amount: number; currency: string; status: string; receipt_url: string; payment_month: string; created_at: string; admin_notes: string | null; }

const PaymentManager = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isActive, daysRemaining, expiresAt, isFreeTrial, freeTrialDaysRemaining, canStartFreeTrial, startFreeTrial } = useSubscription();
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [startingTrial, setStartingTrial] = useState(false);

  useEffect(() => { if (user) fetchReceipts(); }, [user]);

  const fetchReceipts = async () => {
    const { data } = await supabase.from('payment_receipts').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    setReceipts(data || []); setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { if (file.size > 5 * 1024 * 1024) { toast({ title: t('payment.fileTooLarge'), variant: 'destructive' }); return; } setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage.from('user-uploads').upload(fileName, selectedFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('user-uploads').getPublicUrl(fileName);
      const { error: insertError } = await supabase.from('payment_receipts').insert({ user_id: user.id, receipt_url: urlData.publicUrl, amount: 10, currency: 'JOD', payment_month: new Date().toISOString().slice(0, 10) });
      if (insertError) throw insertError;
      toast({ title: t('payment.uploadSuccess'), description: t('payment.waitReview') });
      setSelectedFile(null); setPreviewUrl(null); fetchReceipts();
    } catch (error) { toast({ title: t('common.error'), description: t('payment.uploadFailed'), variant: 'destructive' }); }
    setUploading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 ml-1" />{t('payment.approved')}</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" />{t('payment.rejected')}</Badge>;
      default: return <Badge variant="secondary"><Clock className="h-3 w-3 ml-1" />{t('payment.pending')}</Badge>;
    }
  };

  const handleStartFreeTrial = async () => {
    setStartingTrial(true);
    const success = await startFreeTrial();
    setStartingTrial(false);
    if (success) toast({ title: t('subscription.trialStarted'), description: t('subscription.trialStartedDesc') });
    else toast({ title: t('common.error'), description: t('subscription.trialError'), variant: 'destructive' });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const getCountdownColor = () => { if (!daysRemaining || daysRemaining <= 3) return 'text-destructive'; if (daysRemaining <= 7) return 'text-amber-500'; return 'text-green-500'; };

  return (
    <div className="space-y-6">
      {canStartFreeTrial && !isActive && (
        <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/20"><Gift className="h-6 w-6 text-primary" /></div>
              <div><CardTitle className="text-lg">{t('subscription.freeTrial')}</CardTitle><CardDescription>{t('subscription.freeTrialDesc')}</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={handleStartFreeTrial} disabled={startingTrial} className="w-full h-12 text-lg font-bold">
              {startingTrial ? <><Loader2 className="ml-2 h-5 w-5 animate-spin" />{t('subscription.starting')}</> : <><Gift className="ml-2 h-5 w-5" />{t('subscription.startTrial')}</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {isFreeTrial && isActive && (
        <Card className="border-2 border-green-500/50 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-green-500" />
                <p className="font-semibold">{t('subscription.freeTrialActive')}</p>
              </div>
              <div className="text-end"><p className="text-2xl font-bold text-green-500">{freeTrialDaysRemaining} {t('subscription.days')}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isActive && daysRemaining !== null && (
        <Card className="border-destructive/20 bg-destructive/10">
          <CardContent className="py-4"><div className="flex items-center gap-3"><XCircle className="h-6 w-6 text-destructive" /><p className="font-semibold text-destructive">{t('subscription.expired')}</p></div></CardContent>
        </Card>
      )}

      {!canStartFreeTrial && (
        <>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="h-5 w-5 text-primary" />{t('payment.stripeTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full mt-4" onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('create-checkout', { body: { userId: user?.id } });
                  if (error) throw error;
                  if (data?.url) window.location.href = data.url;
                } catch (err) { toast({ title: t('common.error'), description: t('payment.uploadFailed'), variant: 'destructive' }); }
              }}>
                <CreditCard className="mx-2 h-4 w-4" />{t('payment.stripePay')}
              </Button>
            </CardContent>
          </Card>


          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Upload className="h-5 w-5" />{t('payment.uploadReceipt')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label htmlFor="receipt">{t('payment.selectImage')}</Label><Input id="receipt" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" /></div>
          {previewUrl && <div className="relative"><img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg border object-contain mx-auto" /><Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}><XCircle className="h-4 w-4" /></Button></div>}
          <Button className="w-full" onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />{t('payment.uploading')}</> : <><Upload className="ml-2 h-4 w-4" />{t('payment.sendReceipt')}</>}
          </Button>
        </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">{t('payment.history')}</CardTitle></CardHeader>
        <CardContent>
          {receipts.length === 0 ? <div className="text-center py-8 text-foreground"><FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>{t('payment.noReceipts')}</p></div> : (
            <div className="space-y-4">
              {receipts.map(receipt => (
                <div key={receipt.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <img src={receipt.receipt_url} alt="Receipt" className="w-16 h-16 rounded object-cover border" />
                  <div className="flex-1 min-w-0"><p className="font-semibold">{receipt.amount} {receipt.currency}</p><p className="text-sm text-foreground">{new Date(receipt.created_at).toLocaleDateString('ar-EG')}</p></div>
                  {getStatusBadge(receipt.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentManager;