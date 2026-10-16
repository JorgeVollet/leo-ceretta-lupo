// Pedidos da Lupo que ainda não viraram nota, por tempo desde a criação.
// Datas sempre em horário do Brasil: toISOString() é UTC e, depois das 21h,
// o "hoje" pulava pro dia seguinte.

const pad = (n: number) => String(n).padStart(2, "0");

/** Hoje no fuso do navegador (Brasil), em AAAA-MM-DD. */
export function hojeLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Dias corridos entre uma data AAAA-MM-DD e hoje (sem depender de fuso). */
export function diasDesde(iso: string | null | undefined, hoje = hojeLocalISO()): number | null {
  if (!iso) return null;
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const [ha, hm, hd] = hoje.split("-").map(Number);
  if (!a || !m || !d) return null;
  return Math.floor((Date.UTC(ha, hm - 1, hd) - Date.UTC(a, m - 1, d)) / 86400000);
}

export type FaixaAtraso = "30" | "60" | "90";
export const FAIXAS: { k: FaixaAtraso; titulo: string }[] = [
  { k: "30", titulo: "30 a 59 dias" },
  { k: "60", titulo: "60 a 89 dias" },
  { k: "90", titulo: "90 dias ou mais" },
];

/** Aberto = ainda não faturado nem cancelado. */
export const ehAberto = (status: string) => status === "recebido" || status === "separacao";

export function faixaAtraso(dias: number | null): FaixaAtraso | null {
  if (dias === null) return null;
  if (dias >= 90) return "90";
  if (dias >= 60) return "60";
  if (dias >= 30) return "30";
  return null;
}

type LinhaAtraso = { status: string; data_criacao: string | null; valor_ov: number | null };

/** Faixa de atraso de um pedido (null se não está aberto ou tem menos de 30 dias). */
export function faixaDoPedido(l: LinhaAtraso, hoje = hojeLocalISO()): FaixaAtraso | null {
  return ehAberto(l.status) ? faixaAtraso(diasDesde(l.data_criacao, hoje)) : null;
}

export type ResumoAtraso = Record<FaixaAtraso, { qtde: number; valor: number }>;

export function resumoAtraso(linhas: LinhaAtraso[]): ResumoAtraso {
  const hoje = hojeLocalISO();
  const r: ResumoAtraso = { "30": { qtde: 0, valor: 0 }, "60": { qtde: 0, valor: 0 }, "90": { qtde: 0, valor: 0 } };
  for (const l of linhas) {
    const f = faixaDoPedido(l, hoje);
    if (!f) continue;
    r[f].qtde++;
    r[f].valor += l.valor_ov || 0;
  }
  return r;
}
