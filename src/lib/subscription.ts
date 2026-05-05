/** Paid period length after each approved CliQ receipt (or admin manual activation). */
export const SUBSCRIPTION_PERIOD_DAYS = 30;

/** Next expiry: 30 days after the later of "now" or current period end (renewal stacks). */
export function computeRenewedExpiry(currentExpiryIso: string | null | undefined): string {
  const now = Date.now();
  const currentEnd = currentExpiryIso ? new Date(currentExpiryIso).getTime() : now;
  const base = Math.max(now, currentEnd);
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + SUBSCRIPTION_PERIOD_DAYS);
  return d.toISOString();
}

export function isPublicStoreVisible(params: {
  is_active: boolean;
  subscription_expires_at: string | null | undefined;
}): boolean {
  if (!params.is_active) return false;
  if (!params.subscription_expires_at) return false;
  return new Date(params.subscription_expires_at) > new Date();
}

export function daysUntilExpiry(subscription_expires_at: string | null | undefined): number | null {
  if (!subscription_expires_at) return null;
  return Math.ceil((new Date(subscription_expires_at).getTime() - Date.now()) / 86400000);
}
