import { cn } from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
  /** Pixel height; width scales. Omit and size with `className` (e.g. `h-14 md:h-20`) for responsive logos. */
  height?: number;
  /** Pixel width when fixed box is desired; defaults to `auto` when `height` is set. */
  width?: number;
};

export function BrandLogo({ className, height, width }: BrandLogoProps) {
  const sizeStyle =
    height !== undefined
      ? {
          height,
          width: width !== undefined ? width : ('auto' as const),
        }
      : undefined;

  return (
    <img
      src="/logo-keddmat.png"
      alt="Keddmat"
      className={cn('object-contain select-none', className)}
      style={sizeStyle}
      draggable={false}
    />
  );
}
