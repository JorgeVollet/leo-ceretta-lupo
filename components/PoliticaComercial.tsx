"use client";
import { useEffect, useState } from "react";

/**
 * Política Comercial — botão + modal reaproveitável.
 * variant="card"  → card no estilo dos serviços (seção 05)
 * variant="botao" → botão azul de destaque (páginas de catálogo)
 */

const regras = [
  { t: "Pedido mínimo", d: "R$ 1.000,00" },
  { t: "Lingerie, modeladores e cuecas", d: "Grade em múltiplo de 3 (no tamanho e na cor)" },
  { t: "Meias e meia-calça", d: "Grade em múltiplo de 6" },
  { t: "Pijamas, blusas e Lupo Sport", d: "Sortida, mínimo de 3 peças" },
  { t: "Entrega", d: "Conforme disponibilidade do produto (em média 30 dias)" },
  { t: "Pagamento", d: "Boleto (após análise financeira), cartão ou à vista" },
];

const Ic = ({ d, size = 24 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICON_DOC = "M8 3h8l4 4v14H4V3h4zM15 3v5h5M8 12h8M8 16h6";

export default function PoliticaComercial({
  variant = "card",
  className = "",
}: {
  variant?: "card" | "botao";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {variant === "card" ? (
        <button
          type="button"
          id="politica"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={`group flex scroll-mt-24 flex-col gap-3 rounded-lg border border-line bg-white p-6 text-left shadow-card transition hover:border-accent ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-accent/10 text-accent">
              <Ic d={ICON_DOC} size={20} />
            </div>
            <span className="mono-label text-ink/20">S4</span>
          </div>
          <div>
            <h3 className="font-display text-[16px] font-extrabold tracking-tight text-ink">Política comercial</h3>
            <p className="mt-1 text-[13px] text-mute">Pedido mínimo, grades e formas de pagamento.</p>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={`glow-ring group flex w-full items-center gap-3 rounded bg-accent/10 px-4 py-3.5 text-left transition hover:bg-accent/15 ${className}`}
        >
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded bg-accent text-paper">
            <Ic d={ICON_DOC} size={18} />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[13.5px] font-extrabold uppercase tracking-wide text-accent-deep">
              Ver política comercial
            </span>
            <span className="block text-[11.5px] leading-snug text-accent-deep/70">
              Pedido mínimo, grades e pagamento
            </span>
          </span>
          <span className="ml-auto flex-none text-accent-deep transition group-hover:translate-x-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Política comercial"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-t-2xl border border-line bg-white shadow-2xl sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* cabeçalho */}
            <div className="relative overflow-hidden border-b border-line bg-ink px-6 py-6 text-paper sm:rounded-t-lg">
              <div className="grain absolute inset-0 opacity-[0.06]" />
              <div className="relative z-10">
                <span className="mono-label text-accent-sky">Condições de compra</span>
                <h3 className="headline mt-2 text-paper" style={{ fontSize: "clamp(1.6rem,5vw,2.2rem)" }}>
                  POLÍTICA COMERCIAL
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-paper transition hover:bg-white/10"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* regras */}
            <div className="divide-y divide-line">
              {regras.map((r, i) => (
                <div key={r.t} className="flex gap-3.5 px-6 py-4">
                  <span className="mono-label flex-none pt-0.5 text-accent-deep">0{i + 1}</span>
                  <div className="min-w-0">
                    <div className="font-display text-[15px] font-extrabold tracking-tight text-ink">{r.t}</div>
                    <div className="mt-0.5 text-[13.5px] leading-relaxed text-mute">{r.d}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* rodapé */}
            <div className="border-t border-line bg-bone px-6 py-4">
              <p className="text-[12.5px] leading-relaxed text-mute">
                Dúvidas sobre as condições? Me chame no WhatsApp que eu explico e monto o pedido
                junto com você.
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mono-label mt-3 w-full rounded bg-ink px-4 py-3 text-paper transition hover:bg-accent"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
