import { cn } from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
  /** Pixel height; width scales. Omit and size with `className` (e.g. `h-14 md:h-20`) for responsive logos. */
  height?: number;
};

export function BrandLogo({ className, height }: BrandLogoProps) {
  return (
    <img
      src="/logo-keddmat.png"
      alt="Keddmat"
      className={cn('object-contain select-none', className)}
      style={height !== undefined ? { height, width: 'auto' } : undefined}
      draggable={false}
    />
  );
}
