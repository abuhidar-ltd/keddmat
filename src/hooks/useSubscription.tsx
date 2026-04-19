import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionStatus {
  isActive: boolean;
  loading: boolean;
  lastPaymentDate: Date | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
  isFreeTrial: boolean;
  freeTrialStartedAt: Date | null;
  freeTrialDaysRemaining: number | null;
  canStartFreeTrial: boolean;
}

export const useSubscription = (): SubscriptionStatus & { startFreeTrial: () => Promise<boolean> } => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastPaymentDate, setLastPaymentDate] = useState<Date | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isFreeTrial, setIsFreeTrial] = useState(false);
  const [freeTrialStartedAt, setFreeTrialStartedAt] = useState<Date | null>(null);
  const [freeTrialDaysRemaining, setFreeTrialDaysRemaining] = useState<number | null>(null);
  const [canStartFreeTrial, setCanStartFreeTrial] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('free_trial_started_at, free_trial_used').eq('user_id', user.id).single();
      const hasUsedFreeTrial = profile?.free_trial_used || false;
      const trialStartedAt = profile?.free_trial_started_at ? new Date(profile.free_trial_started_at) : null;
      setCanStartFreeTrial(!hasUsedFreeTrial && !trialStartedAt);

      if (trialStartedAt && !hasUsedFreeTrial) {
        const trialExpiresAt = new Date(trialStartedAt);
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 60);
        const now = new Date();
        const trialActive = now < trialExpiresAt;
        if (trialActive) {
          const days = Math.ceil((trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setIsFreeTrial(true); setFreeTrialStartedAt(trialStartedAt); setFreeTrialDaysRemaining(days);
          setIsActive(true); setExpiresAt(trialExpiresAt); setDaysRemaining(days); setLoading(false); return;
        } else {
          await supabase.from('profiles').update({ free_trial_used: true }).eq('user_id', user.id);
          setIsFreeTrial(false); setFreeTrialDaysRemaining(0);
        }
      }

      const { data: stripeSubscription } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle();
      if (stripeSubscription && stripeSubscription.current_period_end) {
        const expirationDate = new Date(stripeSubscription.current_period_end);
        const now = new Date();
        if (now < expirationDate) {
          const days = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setIsActive(true); setLastPaymentDate(stripeSubscription.current_period_start ? new Date(stripeSubscription.current_period_start) : null);
          setExpiresAt(expirationDate); setDaysRemaining(days); setIsFreeTrial(false); setLoading(false); return;
        }
      }

      const { data: receipts } = await supabase.from('payment_receipts').select('*').eq('user_id', user.id).eq('status', 'approved').order('created_at', { ascending: false }).limit(1);
      if (receipts && receipts.length > 0) {
        const lastPayment = receipts[0];
        const paymentDate = new Date(lastPayment.created_at);
        const expirationDate = new Date(paymentDate);
        expirationDate.setDate(expirationDate.getDate() + 30);
        const now = new Date();
        const active = now < expirationDate;
        const days = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setIsActive(active); setLastPaymentDate(paymentDate); setExpiresAt(expirationDate); setDaysRemaining(active ? days : 0); setIsFreeTrial(false);
      } else {
        setIsActive(false); setLastPaymentDate(null); setExpiresAt(null); setDaysRemaining(null);
      }
    } catch (error) { console.error('Error checking subscription:', error); setIsActive(false); }
    finally { setLoading(false); }
  };

  const startFreeTrial = async (): Promise<boolean> => {
    if (!user || !canStartFreeTrial) { console.error('Cannot start trial:', { user: !!user, canStartFreeTrial }); return false; }
    try {
      const now = new Date().toISOString();
      const { error, count } = await supabase.from('profiles').update({ free_trial_started_at: now, free_trial_used: false }).eq('user_id', user.id).select();
      console.log('Free trial update result:', { error, count });
      if (error) { console.error('Free trial update error:', error); return false; }
      await checkSubscription();
      return true;
    } catch (error) { console.error('Free trial exception:', error); return false; }
  };

  return { isActive, loading, lastPaymentDate, expiresAt, daysRemaining, isFreeTrial, freeTrialStartedAt, freeTrialDaysRemaining, canStartFreeTrial, startFreeTrial };
};