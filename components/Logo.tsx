// Logo Leonardo Ceretta — apenas tipográfica (sem monograma).
// `dark` = pra fundos escuros (texto claro).

export function LogoMark() {
  // Mantido por compatibilidade; agora a "marca" é puramente tipográfica.
  return null;
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="leading-none">
      <div
        className={`font-display text-[19px] font-extrabold uppercase tracking-tight ${
          dark ? "text-paper" : "text-ink"
        }`}
      >
        Leonardo Ceretta
      </div>
      <div className={`mono-label mt-1 ${dark ? "text-accent-sky" : "text-accent-deep"}`}>Representante Lupo</div>
    </div>
  );
}
