import { cn } from '@/lib/utils';

const STORE_PREVIEW_SRC = '/landing-phone-store-preview.png';

/** iPhone-style device framing a real store screenshot inside the display. */
export function LandingPhoneMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex w-max max-w-full min-w-0 shrink-0 flex-col items-center sm:pt-1', className)}
    >
      <div
        className="relative flex w-max max-w-full min-w-0 justify-center px-0 py-1 sm:px-2 sm:py-3 md:justify-start md:py-0 md:pe-2"
        style={{ perspective: '1200px' }}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[min(52vw,11rem)] w-[min(52vw,11rem)] -translate-x-1/2 -translate-y-[40%] rounded-full bg-[#b3d9ff]/55 blur-[1px] sm:h-[min(72vw,22rem)] sm:w-[min(72vw,22rem)] sm:-translate-y-[42%] sm:blur-[2px] md:h-[min(80vw,26rem)] md:w-[min(80vw,26rem)]"
          aria-hidden
        />
        <div
          className="relative z-10 w-[9rem] shrink-0 [transform:rotateY(-10deg)_rotateX(5deg)] sm:w-[15rem] md:w-[17rem] md:[transform:rotateY(-14deg)_rotateX(6deg)]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="rounded-[1.35rem] bg-gradient-to-b from-[#2d2d2f] via-[#1a1a1c] to-[#0e0e0f] p-[4px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset] sm:rounded-[2.1rem] sm:p-[7px] md:rounded-[2.2rem] md:p-[8px]">
            <div className="relative overflow-hidden rounded-[1.1rem] bg-[#f5f0e8] shadow-inner sm:rounded-[1.75rem] md:rounded-[1.85rem]">
              <div className="absolute left-1/2 top-1.5 z-20 h-3 w-10 -translate-x-1/2 rounded-full bg-black sm:top-2 sm:h-4 sm:w-12 md:top-2.5 md:h-[1.125rem] md:w-[4rem]" />

              <img
                src={STORE_PREVIEW_SRC}
                alt="معاينة واجهة متجر على الجوال"
                width={390}
                height={844}
                className="block h-[14.5rem] w-full object-cover object-top sm:h-[24rem] md:h-[26.5rem]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[0.65rem] font-semibold text-gray-700 sm:mt-2 sm:text-sm md:text-base">
        شكل المتجر
      </p>
    </div>
  );
}
