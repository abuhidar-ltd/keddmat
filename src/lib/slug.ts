/** URL-safe slug from Latin letters, numbers, and hyphens (for page_slug). */
export function slugifyLatin(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

const ARABIC_MAP: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a', 'ء': '',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'a',
  // diacritics — strip
  'َ': '', 'ُ': '', 'ِ': '', 'ً': '', 'ٌ': '', 'ٍ': '', 'ّ': '', 'ْ': '', 'ـ': '',
};

function transliterateArabic(input: string): string {
  return input.split('').map(ch => (ch in ARABIC_MAP ? ARABIC_MAP[ch] : ch)).join('');
}

/** Generate a slug from a store name (Arabic or Latin). Falls back to a short random ID. */
export function generateSlug(storeName: string): string {
  const fromName = slugifyLatin(transliterateArabic(storeName.trim()));
  if (fromName) return fromName;
  return 'store-' + Math.random().toString(36).slice(2, 8);
}
