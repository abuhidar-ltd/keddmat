/** Allow-listed phones for automatic `user_roles.admin` assignment. */
export const ADMIN_PHONES = ['0790605805', '962790605805', '0795666185', '962795666185'] as const;

export function isAdminPhoneDigits(cleanPhone: string): boolean {
  return ADMIN_PHONES.some(p => cleanPhone === p || cleanPhone === p.replace(/^0/, ''));
}

/** Digits from `{digits}.merchant@phone.local` emails used for phone auth. */
export function digitsFromMerchantEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  const m = normalized.match(/^(\d+)\.merchant@phone\.local$/);
  return m ? m[1] : null;
}
