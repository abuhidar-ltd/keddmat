/** Logo gradient: cyan → purple (matches /public/logo-khadamat.png) */
export const brand = {
  cyan: '#00AEEF',
  purple: '#7B2CBF',
  footer: '#1e1b4b',
  surface: '#f5f3ff',
} as const;

export const brandGradient = `linear-gradient(135deg, ${brand.cyan}, ${brand.purple})`;
