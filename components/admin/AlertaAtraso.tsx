"use client";

import { FAIXAS, type FaixaAtraso, type ResumoAtraso } from "@/lib/atraso";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COR: Record<FaixaAtraso, { borda: string; fundo: string; texto: string; ponto: string }> = {
  "30": { borda: "border-amber-300", fundo: "bg-amber-50", texto: "text-amber-800", ponto: "bg-amber-500" },
  "60": { borda: "border-orange-300", fundo: "bg-orange-50", texto: "text-orange-800", ponto: "bg-orange-500" },
  "90": { borda: "border-red-300", fundo: "bg-red-50", texto: "text-red-700", ponto: "bg-red-600" },
};

/**
 * Pedidos da Lupo abertos (não faturados, não cancelados) há 30, 60 e 90+ dias.
 * Usado no topo da aba Pedidos (clicar filtra a lista) e na Visão geral (clicar leva pra lista).
 */
export default function AlertaAtraso({
  resumo, ativo, onEscolher,
}: {
  resumo: ResumoAtraso;
  ativo?: FaixaAtraso | "";
  onEscolher: (f: FaixaAtraso) => void;
}) {
  const total = resumo["30"].qtde + resumo["60"].qtde + resumo["90"].qtde;

  if (total === 0) {
    return (
      <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-800">
        Nenhum pedido aberto há mais de 30 dias.
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <span className="font-display text-[15px] font-extrabold tracking-tight text-ink">Pedidos não faturados</span>
        <span className="text-[12.5px] text-mute">abertos há mais de 30 dias (desde a criação do pedido) · clique pra ver a lista</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FAIXAS.map(({ k, titulo }) => {
          const c = COR[k];
          const on = ativo === k;
          return (
            <button
              key={k}
              onClick={() => onEscolher(k)}
              className={`rounded-lg border p-4 text-left transition ${c.borda} ${c.fundo} ${on ? "ring-2 ring-accent/50" : "hover:brightness-[0.98]"}`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${c.ponto}`} />
                <span className={`mono-label ${c.texto}`}>{titulo}</span>
              </div>
              <div className={`mt-1.5 font-display text-[24px] font-extrabold tracking-tight ${c.texto}`}>
                {resumo[k].qtde} <span className="text-[13px] font-bold">pedido{resumo[k].qtde === 1 ? "" : "s"}</span>
              </div>
              <div className={`text-[12.5px] font-semibold ${c.texto} opacity-80`}>{brl(resumo[k].valor)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
