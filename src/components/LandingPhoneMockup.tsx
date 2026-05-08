const STORE_PREVIEW_SRC = '/landing-phone-store-preview.png';

/** iPhone-style device framing a real store screenshot inside the display. */
export function LandingPhoneMockup() {
  return (
    <div className="relative flex w-full justify-center px-2 py-4 md:py-8" style={{ perspective: '1200px' }}>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[min(88vw,28rem)] w-[min(88vw,28rem)] -translate-x-1/2 -translate-y-[45%] rounded-full bg-[#b3d9ff]/55 blur-[2px]"
        aria-hidden
      />
      <div
        className="relative z-10 w-[min(100%,15.5rem)] sm:w-[17.5rem] md:w-[19.5rem]"
        style={{
          transform: 'rotateY(-14deg) rotateX(6deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="rounded-[2.35rem] bg-gradient-to-b from-[#2d2d2f] via-[#1a1a1c] to-[#0e0e0f] p-[9px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
        >
          <div className="relative overflow-hidden rounded-[1.95rem] bg-[#f5f0e8] shadow-inner">
            <div className="absolute left-1/2 top-2.5 z-20 h-5 w-[4.25rem] -translate-x-1/2 rounded-full bg-black" />

            <img
              src={STORE_PREVIEW_SRC}
              alt="معاينة واجهة متجر على الجوال"
              width={390}
              height={844}
              className="block h-[26.5rem] w-full object-cover object-top sm:h-[28rem]"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
