"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/**
 * Visão geral do faturamento: KPIs + gráfico + tabela mensal, tudo reativo
 * a um único par de estado (período + granularidade). Duas linhas do tempo,
 * lado a lado, sem misturar:
 *  - "Pedidos criados"  -> usa data_criacao (quando o pedido entrou)
 *  - "Faturado"         -> usa data_emissao da nota, só status faturado/despachado
 */

export type LinhaFaturamento = {
  data_criacao: string | null;
  data_emissao: string | null;
  valor_ov: number | null;
  valor_fatura: number | null;
  status: string;
};

type Granularidade = "dia" | "semana" | "mes";
type PresetKey = "mes" | "3m" | "6m" | "12m" | "custom";

/* ---------- formatação ---------- */
const brl = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function brlCompacto(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1_000) return `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return brl(v);
}

/* ---------- datas (tudo em string "AAAA-MM-DD", sem depender de timezone local) ---------- */
function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function ymd(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}
function addDays(iso: string, dias: number): string {
  const dt = new Date(iso + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + dias);
  return dt.toISOString().slice(0, 10);
}
function addMonths(iso: string, meses: number): string {
  const { y, m, d } = ymd(iso);
  const dt = new Date(Date.UTC(y, m - 1 + meses, d));
  return dt.toISOString().slice(0, 10);
}
function startOfMonth(iso: string): string {
  return iso.slice(0, 7) + "-01";
}
function endOfMonth(iso: string): string {
  const { y, m } = ymd(iso);
  const dt = new Date(Date.UTC(y, m, 0));
  return dt.toISOString().slice(0, 10);
}
function startOfWeek(iso: string): string {
  const dt = new Date(iso + "T00:00:00Z");
  const dow = dt.getUTCDay();
  const diff = dow === 0 ? 6 : dow - 1;
  dt.setUTCDate(dt.getUTCDate() - diff);
  return dt.toISOString().slice(0, 10);
}
function diffDiasInclusive(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86400000) + 1;
}
function bucketKey(iso: string, g: Granularidade): string {
  if (g === "dia") return iso;
  if (g === "semana") return startOfWeek(iso);
  return startOfMonth(iso);
}
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
function bucketLabel(key: string, g: Granularidade): string {
  const { y, m, d } = ymd(key);
  if (g === "mes") return `${MESES[m - 1]}/${String(y).slice(2)}`;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}
function gerarBuckets(inicio: string, fim: string, g: Granularidade): string[] {
  const buckets: string[] = [];
  let cursor = bucketKey(inicio, g);
  const fimKey = bucketKey(fim, g);
  let guarda = 0;
  while (cursor <= fimKey && guarda < 400) {
    buckets.push(cursor);
    cursor = g === "dia" ? addDays(cursor, 1) : g === "semana" ? addDays(cursor, 7) : addMonths(cursor, 1);
    guarda++;
  }
  return buckets;
}
function fmtBR(iso: string): string {
  const { y, m, d } = ymd(iso);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

/* ---------- agregação ---------- */
function agregarPeriodo(linhas: LinhaFaturamento[], inicio: string, fim: string) {
  let criadosQtde = 0, criadosValor = 0, faturadoQtde = 0, faturadoValor = 0;
  for (const l of linhas) {
    const dc = l.data_criacao?.slice(0, 10);
    if (l.status !== "cancelado" && dc && dc >= inicio && dc <= fim) {
      criadosQtde++; criadosValor += l.valor_ov || 0;
    }
    const de = l.data_emissao?.slice(0, 10);
    if ((l.status === "faturado" || l.status === "despachado") && de && de >= inicio && de <= fim) {
      faturadoQtde++; faturadoValor += l.valor_fatura || 0;
    }
  }
  const ticket = criadosQtde > 0 ? criadosValor / criadosQtde : 0;
  return { criadosQtde, criadosValor, faturadoQtde, faturadoValor, ticket };
}

function delta(atual: number, anterior: number): number | null {
  if (anterior <= 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

function Delta({ v }: { v: number | null }) {
  if (v === null) return <span className="text-[11.5px] text-ink/35">sem comparação</span>;
  const pos = v >= 0;
  const abs = Math.abs(v);
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 text-[11.5px] font-semibold ${pos ? "text-emerald-700" : "text-red-600"}`}>
      <span>{pos ? "▲" : "▼"}</span>
      {abs.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
      <span className="font-normal text-ink/40">vs período anterior</span>
    </span>
  );
}

function TooltipCustom({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-line bg-ink px-3.5 py-2.5 text-paper shadow-lift">
      <div className="mono-label mb-1.5 text-paper/60">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 text-[12.5px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
            {p.name}
          </span>
          <span className="font-semibold">{brl(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

const PRESETS: { k: PresetKey; label: string; meses: number; gran: Granularidade }[] = [
  { k: "mes", label: "Este mês", meses: 0, gran: "dia" },
  { k: "3m", label: "3 meses", meses: 2, gran: "semana" },
  { k: "6m", label: "6 meses", meses: 5, gran: "mes" },
  { k: "12m", label: "12 meses", meses: 11, gran: "mes" },
];

export default function FaturamentoDashboard({ linhas }: { linhas: LinhaFaturamento[] }) {
  const hoje = hojeISO();
  const inicioMesAtual = startOfMonth(hoje);

  const [presetAtivo, setPresetAtivo] = useState<PresetKey>("3m");
  const [periodoInicio, setPeriodoInicio] = useState<string>(addMonths(inicioMesAtual, -2));
  const [periodoFim, setPeriodoFim] = useState<string>(hoje);
  const [granularidade, setGranularidade] = useState<Granularidade>("semana");
  const [mesPersonalizado, setMesPersonalizado] = useState("");

  function aplicarPreset(p: (typeof PRESETS)[number]) {
    setPresetAtivo(p.k);
    setPeriodoInicio(addMonths(inicioMesAtual, -p.meses));
    setPeriodoFim(hoje);
    setGranularidade(p.gran);
    setMesPersonalizado("");
  }

  function selecionarMes(mes: string) {
    if (!mes) return;
    const inicio = `${mes}-01`;
    const fimCalculado = endOfMonth(inicio);
    setPeriodoInicio(inicio);
    setPeriodoFim(fimCalculado > hoje ? hoje : fimCalculado);
    setGranularidade("dia");
    setPresetAtivo("custom");
    setMesPersonalizado(mes);
  }

  function irParaMes(mesKey: string) {
    selecionarMes(mesKey.slice(0, 7));
  }

  const spanDias = useMemo(() => diffDiasInclusive(periodoInicio, periodoFim), [periodoInicio, periodoFim]);
  const opcoesGranularidade = useMemo(() => {
    const todas: { k: Granularidade; t: string }[] = [
      { k: "dia", t: "Dia" },
      { k: "semana", t: "Semana" },
      { k: "mes", t: "Mês" },
    ];
    if (spanDias > 200) return todas.filter((o) => o.k === "mes");
    if (spanDias > 62) return todas.filter((o) => o.k !== "dia");
    return todas;
  }, [spanDias]);
  useEffect(() => {
    if (!opcoesGranularidade.some((o) => o.k === granularidade)) {
      setGranularidade(opcoesGranularidade[opcoesGranularidade.length - 1].k);
    }
  }, [opcoesGranularidade, granularidade]);

  const periodoAnterior = useMemo(() => {
    const dias = diffDiasInclusive(periodoInicio, periodoFim);
    const fimAnt = addDays(periodoInicio, -1);
    const inicioAnt = addDays(fimAnt, -(dias - 1));
    return { inicio: inicioAnt, fim: fimAnt };
  }, [periodoInicio, periodoFim]);

  const kpiAtual = useMemo(() => agregarPeriodo(linhas, periodoInicio, periodoFim), [linhas, periodoInicio, periodoFim]);
  const kpiAnterior = useMemo(
    () => agregarPeriodo(linhas, periodoAnterior.inicio, periodoAnterior.fim),
    [linhas, periodoAnterior]
  );

  const dadosGrafico = useMemo(() => {
    const buckets = gerarBuckets(periodoInicio, periodoFim, granularidade);
    const mapa = new Map<string, { criados: number; faturado: number }>();
    buckets.forEach((b) => mapa.set(b, { criados: 0, faturado: 0 }));
    for (const l of linhas) {
      const dc = l.data_criacao?.slice(0, 10);
      if (l.status !== "cancelado" && dc && dc >= periodoInicio && dc <= periodoFim) {
        const cur = mapa.get(bucketKey(dc, granularidade));
        if (cur) cur.criados += l.valor_ov || 0;
      }
      const de = l.data_emissao?.slice(0, 10);
      if ((l.status === "faturado" || l.status === "despachado") && de && de >= periodoInicio && de <= periodoFim) {
        const cur = mapa.get(bucketKey(de, granularidade));
        if (cur) cur.faturado += l.valor_fatura || 0;
      }
    }
    return buckets.map((b) => ({ key: b, label: bucketLabel(b, granularidade), ...mapa.get(b)! }));
  }, [linhas, periodoInicio, periodoFim, granularidade]);

  const tabelaMensal = useMemo(() => {
    const inicio = addMonths(inicioMesAtual, -11);
    const buckets = gerarBuckets(inicio, hoje, "mes");
    const mapa = new Map<string, { criadosQtde: number; criadosValor: number; faturadoQtde: number; faturadoValor: number }>();
    buckets.forEach((b) => mapa.set(b, { criadosQtde: 0, criadosValor: 0, faturadoQtde: 0, faturadoValor: 0 }));
    for (const l of linhas) {
      const dc = l.data_criacao?.slice(0, 10);
      if (l.status !== "cancelado" && dc && dc >= inicio) {
        const cur = mapa.get(bucketKey(dc, "mes"));
        if (cur) { cur.criadosQtde++; cur.criadosValor += l.valor_ov || 0; }
      }
      const de = l.data_emissao?.slice(0, 10);
      if ((l.status === "faturado" || l.status === "despachado") && de && de >= inicio) {
        const cur = mapa.get(bucketKey(de, "mes"));
        if (cur) { cur.faturadoQtde++; cur.faturadoValor += l.valor_fatura || 0; }
      }
    }
    return buckets.map((b) => ({ key: b, ...mapa.get(b)! })).reverse();
  }, [linhas, inicioMesAtual, hoje]);

  const totalTabela = useMemo(
    () =>
      tabelaMensal.reduce(
        (acc, m) => ({
          criadosQtde: acc.criadosQtde + m.criadosQtde,
          criadosValor: acc.criadosValor + m.criadosValor,
          faturadoQtde: acc.faturadoQtde + m.faturadoQtde,
          faturadoValor: acc.faturadoValor + m.faturadoValor,
        }),
        { criadosQtde: 0, criadosValor: 0, faturadoQtde: 0, faturadoValor: 0 }
      ),
    [tabelaMensal]
  );

  return (
    <div className="space-y-5">
      {/* CONTROLES */}
      <div className="rounded-lg border border-line bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[16px] font-extrabold tracking-tight text-ink">Visão geral</h2>
            <p className="mt-0.5 text-[12.5px] text-mute">
              Exibindo {fmtBR(periodoInicio)} – {fmtBR(periodoFim)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-lg border border-line bg-bone p-1">
              {PRESETS.map((p) => (
                <button
                  key={p.k}
                  onClick={() => aplicarPreset(p)}
                  className={`mono-label rounded px-3.5 py-2 transition ${presetAtivo === p.k ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              type="month"
              value={mesPersonalizado}
              onChange={(e) => selecionarMes(e.target.value)}
              max={hoje.slice(0, 7)}
              className="rounded border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="mono-label text-ink/45">Ver por:</span>
          <div className="inline-flex rounded-lg border border-line bg-bone p-1">
            {opcoesGranularidade.map((o) => (
              <button
                key={o.k}
                onClick={() => setGranularidade(o.k)}
                className={`mono-label rounded px-3.5 py-2 transition ${granularidade === o.k ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"}`}
              >
                {o.t}
              </button>
            ))}
          </div>
          {spanDias > 62 && <span className="text-[11.5px] text-ink/35">período longo — visão diária fica ilegível, por isso ela some daqui</span>}
        </div>
      </div>

      {/* KPIs do período selecionado */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-line bg-ink p-4 text-paper">
          <div className="font-display text-[19px] font-extrabold tracking-tight">{brl(kpiAtual.criadosValor)}</div>
          <div className="mt-0.5 text-[11px] text-paper/60">Pedidos criados no período</div>
          <div className="mt-1.5">
            <Delta v={delta(kpiAtual.criadosValor, kpiAnterior.criadosValor)} />
          </div>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <div className="font-display text-[19px] font-extrabold tracking-tight text-ink">{kpiAtual.criadosQtde.toLocaleString("pt-BR")}</div>
          <div className="mt-0.5 text-[11px] text-mute">Qtde de pedidos criados</div>
          <div className="mt-1.5">
            <Delta v={delta(kpiAtual.criadosQtde, kpiAnterior.criadosQtde)} />
          </div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="font-display text-[19px] font-extrabold tracking-tight text-emerald-700">{brl(kpiAtual.faturadoValor)}</div>
          <div className="mt-0.5 text-[11px] text-emerald-700/70">Faturado no período ({kpiAtual.faturadoQtde} notas)</div>
          <div className="mt-1.5">
            <Delta v={delta(kpiAtual.faturadoValor, kpiAnterior.faturadoValor)} />
          </div>
        </div>
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <div className="font-display text-[19px] font-extrabold tracking-tight text-accent-deep">{brl(kpiAtual.ticket)}</div>
          <div className="mt-0.5 text-[11px] text-accent-deep/70">Ticket médio (pedidos criados)</div>
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-ink/40">
        &quot;Pedidos criados&quot; usa a data de criação da ordem. &quot;Faturado&quot; usa a data de emissão da nota fiscal — por isso os dois números
        não são o mesmo pedido necessariamente: um pedido criado agora pode ser faturado só no mês que vem.
      </p>

      {/* GRÁFICO */}
      <div className="rounded-lg border border-line bg-white p-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE0E6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#333A45" }} axisLine={{ stroke: "#DDE0E6" }} tickLine={false} />
            <YAxis tickFormatter={(v) => brlCompacto(Number(v))} tick={{ fontSize: 11, fill: "#333A45" }} axisLine={false} tickLine={false} width={72} />
            <Tooltip content={<TooltipCustom />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="criados" name="Pedidos criados" fill="#2563EB" radius={[3, 3, 0, 0]} maxBarSize={40} />
            <Bar dataKey="faturado" name="Faturado" fill="#059669" radius={[3, 3, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TABELA MENSAL — sempre por mês, últimos 12 meses, independente do gráfico acima */}
      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <span className="font-display text-[14px] font-extrabold tracking-tight text-ink">Fechamento mensal (últimos 12 meses)</span>
          <span className="mono-label text-ink/40">clique num mês pra abrir o detalhe por dia</span>
        </div>
        <div className="hidden bg-ink px-4 py-3 text-paper lg:grid lg:grid-cols-[110px_1fr_1fr_150px]">
          <span className="mono-label">Mês</span>
          <span className="mono-label text-right">Pedidos criados</span>
          <span className="mono-label text-right">Faturado (notas)</span>
          <span className="mono-label text-right">Qtde pedidos / notas</span>
        </div>
        <div className="divide-y divide-line">
          {tabelaMensal.map((m) => {
            const ativo = presetAtivo === "custom" && m.key === startOfMonth(periodoInicio);
            return (
              <button
                key={m.key}
                onClick={() => irParaMes(m.key)}
                className={`grid w-full gap-1 px-4 py-3.5 text-left transition hover:bg-bone lg:grid-cols-[110px_1fr_1fr_150px] lg:items-center lg:gap-3 ${ativo ? "bg-accent/5" : ""}`}
              >
                <span className="font-display text-[13.5px] font-extrabold capitalize text-ink">{bucketLabel(m.key, "mes")}</span>
                <span className="text-[13px] font-semibold text-ink lg:text-right">{brl(m.criadosValor)}</span>
                <span className="text-[13px] font-semibold text-emerald-700 lg:text-right">{brl(m.faturadoValor)}</span>
                <span className="text-[12px] text-mute lg:text-right">{m.criadosQtde} / {m.faturadoQtde}</span>
              </button>
            );
          })}
        </div>
        <div className="grid gap-1 border-t-2 border-ink/10 bg-bone px-4 py-3.5 lg:grid-cols-[110px_1fr_1fr_150px] lg:items-center lg:gap-3">
          <span className="mono-label text-ink/55">Total 12m</span>
          <span className="text-[13px] font-extrabold text-ink lg:text-right">{brl(totalTabela.criadosValor)}</span>
          <span className="text-[13px] font-extrabold text-emerald-700 lg:text-right">{brl(totalTabela.faturadoValor)}</span>
          <span className="text-[12px] font-semibold text-mute lg:text-right">{totalTabela.criadosQtde} / {totalTabela.faturadoQtde}</span>
        </div>
      </div>
    </div>
  );
}
