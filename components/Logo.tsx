// Logo Leonardo Ceretta — monograma LC elegante (navy/azul, sem vermelho)

export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lc-g" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E3A6B" />
          <stop offset="1" stopColor="#0A1224" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#lc-g)" />
      <rect x="0.6" y="0.6" width="46.8" height="46.8" rx="12.4" stroke="#3B82F6" strokeOpacity="0.35" strokeWidth="1.2" />
      {/* L */}
      <path d="M15 13.5V32.5H25.5" stroke="#F7F9FC" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* C */}
      <path
        d="M33.5 18.2A7.3 7.3 0 1 0 33.5 29.8"
        stroke="#60A5FA"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ stacked = false }: { stacked?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      <div className={stacked ? "leading-tight" : "leading-tight"}>
        <div className="font-display text-[17px] font-extrabold tracking-tight text-cloud">
          Leonardo Ceretta
        </div>
        <div className="text-[10.5px] uppercase tracking-[0.22em] text-accent-bright/80">
          Representante Lupo
        </div>
      </div>
    </div>
  );
}
