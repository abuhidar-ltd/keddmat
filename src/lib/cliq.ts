/** CliQ alias shown to merchants; must match your real CliQ handle if different from display name. */
export function getCliqAlias(): string {
  const v = import.meta.env.VITE_CLIQ_ALIAS;
  if (typeof v === 'string' && v.trim()) return v.trim();
  return 'خدمات';
}
