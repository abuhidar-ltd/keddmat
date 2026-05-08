import { cn } from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
  /** Pixel height; width scales with aspect ratio */
  height?: number;
};

export function BrandLogo({ className, height = 44 }: BrandLogoProps) {
  return (
    <img
      src="/logo-khadamat.jpg"
      alt="خدمات"
      className={cn('object-contain select-none', className)}
      style={{ height, width: 'auto' }}
      draggable={false}
    />
  );
}
