import { useSubscription } from '@/hooks/useSubscription';
import { useLanguage } from '@/hooks/useLanguage';
import { Clock, Gift, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TrialCountdown = () => {
  const { isActive, loading, isFreeTrial, freeTrialDaysRemaining, daysRemaining, expiresAt } = useSubscription();
  const { t } = useLanguage();

  if (loading) return <div className="h-16 bg-muted/50 rounded-lg animate-pulse" />;
  if (!isActive) return null;

  const days = isFreeTrial ? freeTrialDaysRemaining : daysRemaining;
  const colors = {
    bg: 'bg-success/10', text: 'text-success', border: 'border-success/30', icon: 'text-success'
  };

  const Icon = days !== null && days <= 3 ? AlertTriangle : isFreeTrial ? Gift : CheckCircle;
  const formattedDate = expiresAt ? new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(expiresAt) : '';

  return (
    <div className={cn("rounded-xl border-2 p-4 transition-all duration-300 animate-fade-in backdrop-blur-sm", colors.bg, colors.border)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full", colors.bg)}><Icon className={cn("h-6 w-6", colors.icon)} /></div>
          <div>
            <p className={cn("font-bold text-lg", colors.text)}>{isFreeTrial ? t('subscription.freeTrialActive') : t('subscription.status')}</p>
            <p className="text-sm text-muted-foreground">{t('subscription.expiresOn')}: {formattedDate}</p>
          </div>
        </div>
        <div className="text-center">
          <div className={cn("text-4xl font-bold tabular-nums", colors.text)}>{days}</div>
          <p className="text-sm text-muted-foreground">{t('subscription.daysLeft')}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 bg-success" style={{ width: `${Math.min(100, ((days || 0) / 30) * 100)}%` }} />
        </div>
      </div>
      {days !== null && days <= 3 && <p className={cn("mt-3 text-sm font-medium", colors.text)}>⚠️ {t('subscription.renewSoon')}</p>}
    </div>
  );
};

export default TrialCountdown;