/** Allow-listed admin phones. */
export const ADMIN_PHONES = ['0790605805', '962790605805', '0795666185', '962795666185', '+962795666185'] as const;

export function isAdminPhoneDigits(cleanPhone: string): boolean {
  return ADMIN_PHONES.some(p => cleanPhone === p || cleanPhone === p.replace(/^0/, ''));
}

/** Extracts phone digits from a keddmat fake email (e.g. 0795666185@keddmat.com → "0795666185"). */
export function digitsFromKeddmatEmail(email: string): string | null {
  const m = email.trim().toLowerCase().match(/^(\d+)@keddmat\.com$/);
  return m ? m[1] : null;
}
