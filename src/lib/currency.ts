// Currency map built from the exact phone prefixes in src/components/PhoneInput.tsx
const PHONE_TO_CURRENCY: Record<string, { code: string; symbol: string }> = {
  '966': { code: 'SAR', symbol: 'ر.س' },
  '971': { code: 'AED', symbol: 'د.إ' },
  '965': { code: 'KWD', symbol: 'د.ك' },
  '973': { code: 'BHD', symbol: 'د.ب' },
  '974': { code: 'QAR', symbol: 'ر.ق' },
  '968': { code: 'OMR', symbol: 'ر.ع' },
  '962': { code: 'JOD', symbol: 'د.أ' },
  '963': { code: 'SYP', symbol: 'ل.س' },
  '961': { code: 'LBP', symbol: 'ل.ل' },
  '970': { code: 'JOD', symbol: 'د.أ' },
  '964': { code: 'IQD', symbol: 'د.ع' },
  '967': { code: 'YER', symbol: 'ر.ي' },
  '218': { code: 'LYD', symbol: 'د.ل' },
  '216': { code: 'TND', symbol: 'د.ت' },
  '213': { code: 'DZD', symbol: 'د.ج' },
  '212': { code: 'MAD', symbol: 'د.م' },
  '222': { code: 'MRU', symbol: 'أ.م' },
  '249': { code: 'SDG', symbol: 'ج.س' },
  '252': { code: 'SOS', symbol: 'ش.ص' },
  '253': { code: 'DJF', symbol: 'فرنك' },
  '269': { code: 'KMF', symbol: 'فرنك' },
  '20':  { code: 'EGP', symbol: 'ج.م' },
};

const DEFAULT_CURRENCY = { code: 'JOD', symbol: 'د.أ' };

export const phoneToCurrency = (phone: string | null | undefined): { code: string; symbol: string } => {
  if (!phone) return DEFAULT_CURRENCY;
  const digits = phone.replace(/[^0-9]/g, '');
  // Check 3-digit prefixes before 2-digit to avoid false matches (e.g. "20x" vs "218")
  for (const len of [3, 2]) {
    const prefix = digits.slice(0, len);
    if (PHONE_TO_CURRENCY[prefix]) return PHONE_TO_CURRENCY[prefix];
  }
  return DEFAULT_CURRENCY;
};

export const formatPrice = (price: number, currency: { symbol: string }): string => {
  return `${price.toFixed(3)} ${currency.symbol}`;
};

export const cleanWhatsAppNumber = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const cleaned = digits.replace(/^0+/, '');
  return cleaned;
};
