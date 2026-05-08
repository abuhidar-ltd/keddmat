const STORE_PREVIEW_SRC = '/landing-phone-store-preview.png';

/** iPhone-style device framing a real store screenshot inside the display. */
export function LandingPhoneMockup() {
  return (
    <div
      className="relative flex w-full min-w-0 justify-center px-0 py-1 sm:px-2 sm:py-3 md:justify-start md:py-0 md:ps-2"
      style={{ perspective: '1200px' }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[min(62vw,14rem)] w-[min(62vw,14rem)] -translate-x-1/2 -translate-y-[42%] rounded-full bg-[#b3d9ff]/55 blur-[1px] sm:h-[min(88vw,28rem)] sm:w-[min(88vw,28rem)] sm:blur-[2px]"
        aria-hidden
      />
      <div
        className="relative z-10 w-[10.25rem] shrink-0 [transform:rotateY(-10deg)_rotateX(5deg)] sm:w-[17.5rem] md:w-[19.5rem] md:[transform:rotateY(-14deg)_rotateX(6deg)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="rounded-[1.65rem] bg-gradient-to-b from-[#2d2d2f] via-[#1a1a1c] to-[#0e0e0f] p-[5px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset] sm:rounded-[2.35rem] sm:p-[9px]">
          <div className="relative overflow-hidden rounded-[1.35rem] bg-[#f5f0e8] shadow-inner sm:rounded-[1.95rem]">
            <div className="absolute left-1/2 top-2 z-20 h-3.5 w-12 -translate-x-1/2 rounded-full bg-black sm:top-2.5 sm:h-5 sm:w-[4.25rem]" />

            <img
              src={STORE_PREVIEW_SRC}
              alt="معاينة واجهة متجر على الجوال"
              width={390}
              height={844}
              className="block h-[17.25rem] w-full object-cover object-top sm:h-[29rem] md:h-[31rem]"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
