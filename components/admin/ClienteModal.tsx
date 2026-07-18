"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { STATUS_LABEL, STATUS_COR } from "@/lib/parsers";

type OV = {
  ordem_venda: string;
  cliente_nome: string | null;
  cliente_codigo: string | null;
  uf: string | null;
  deposito: string | null;
  valor_ov: number | null;
  valor_fatura: number | null;
  status: string;
  status_origem: string | null;
  status_legado: string | null;
  status_credito: string | null;
  nota_fiscal: string | null;
  duplicata: string | null;
  qtde_solicitada: number | null;
  qtde_atendida: number | null;
  cond_pagamento: string | null;
  transportadora: string | null;
  data_criacao: string | null;
  data_emissao: string | null;
  data_expedicao: string | null;
};
type ItemNota = { item: number | null; codigo: string | null; ean: string | null; descricao: string | null; quantidade: number | null; valor_unit: number | null; valor_total: number | null };
type DupNota = { parcela: string | null; vencimento: string | null; valor: number | null };
type NotaFull = {
  id: string; numero: string | null; serie: string | null; chave: string | null;
  emissao: string | null; valor_total: number | null;
  dest_nome: string | null; dest_cnpj: string | null; dest_municipio: string | null; dest_uf: string | null; dest_fone: string | null;
  transportadora: string | null; volumes: number | null; peso_bruto: number | null;
};

function brl(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function dataBR(v: string | null) {
  if (!v) return "—";
  const d = v.slice(0, 10); const [a, m, dia] = d.split("-");
  return dia ? `${dia}/${m}/${a}` : v;
}
function cnpjFmt(v: string | null) {
  if (!v) return "—";
  const d = v.replace(/\D/g, "");
  if (d.length !== 14) return v;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

export default function ClienteModal({
  cliente,
  ordemFoco,
  onClose,
}: {
  cliente: string;
  ordemFoco?: string | null;
  onClose: () => void;
}) {
  const [pedidos, setPedidos] = useState<OV[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ovAberta, setOvAberta] = useState<string | null>(ordemFoco || null);
  const [notaFull, setNotaFull] = useState<NotaFull | null>(null);
  const [itens, setItens] = useState<ItemNota[]>([]);
  const [dups, setDups] = useState<DupNota[]>([]);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  useEffect(() => {
    (async () => {
      if (!supabaseBrowser) return setCarregando(false);
      const { data } = await supabaseBrowser
        .from("ordens_venda").select("*")
        .eq("cliente_nome", cliente)
        .order("data_criacao", { ascending: false });
      setPedidos((data as OV[]) || []);
      setCarregando(false);
    })();
  }, [cliente]);

  // carrega o detalhe da nota de uma OV
  async function abrirDetalhe(ov: string) {
    if (ovAberta === ov) { setOvAberta(null); return; }
    setOvAberta(ov);
    setNotaFull(null); setItens([]); setDups([]);
    if (!supabaseBrowser) return;
    setCarregandoDetalhe(true);
    const { data: nota } = await supabaseBrowser.from("notas").select("*").eq("ordem_venda", ov).limit(1).maybeSingle();
    if (nota) {
      setNotaFull(nota as NotaFull);
      const [ri, rd] = await Promise.all([
        supabaseBrowser.from("nota_itens").select("item,codigo,ean,descricao,quantidade,valor_unit,valor_total").eq("nota_id", (nota as NotaFull).id).order("item"),
        supabaseBrowser.from("nota_duplicatas").select("parcela,vencimento,valor").eq("nota_id", (nota as NotaFull).id).order("vencimento"),
      ]);
      setItens((ri.data as ItemNota[]) || []);
      setDups((rd.data as DupNota[]) || []);
    }
    setCarregandoDetalhe(false);
  }

  useEffect(() => { if (ordemFoco) abrirDetalhe(ordemFoco); /* eslint-disable-next-line */ }, []);

  // números do cliente
  const ativos = pedidos.filter((p) => p.status !== "cancelado");
  const totalComprado = ativos.reduce((s, p) => s + (p.valor_fatura || p.valor_ov || 0), 0);
  const ticketMedio = ativos.length > 0 ? totalComprado / ativos.length : 0;
  const porStatus = pedidos.reduce<Record<string, number>>((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
  const ref = pedidos[0];

  return (
    <div className="fixed inset-0 z-[240] flex items-end justify-center bg-ink/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex max-h-[94vh] w-full max-w-[820px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
        {/* cabeçalho */}
        <div className="relative shrink-0 overflow-hidden bg-ink px-6 py-6 text-paper">
          <div className="grain absolute inset-0 opacity-[0.06]" />
          <div className="relative z-10 pr-10">
            <span className="mono-label text-accent-sky">Ficha do cliente</span>
            <h3 className="mt-1.5 font-display text-[22px] font-extrabold leading-tight tracking-tight text-paper sm:text-[26px]">
              {cliente}
            </h3>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-paper/70">
              {ref?.uf && <span>UF {ref.uf}</span>}
              {ref?.cliente_codigo && <span>Cód. {ref.cliente_codigo}</span>}
              {ref?.cond_pagamento && <span>Cond. {ref.cond_pagamento}</span>}
              {ref?.status_credito && <span>Crédito {ref.status_credito}</span>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-paper transition hover:bg-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {/* corpo scrollável */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {carregando ? (
            <p className="text-[14px] text-mute">Carregando...</p>
          ) : (
            <>
              {/* KPIs do cliente */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-line bg-bone p-3.5">
                  <div className="font-display text-[18px] font-extrabold tracking-tight text-accent-deep">{brl(totalComprado)}</div>
                  <div className="mt-0.5 text-[11px] text-mute">Total comprado</div>
                </div>
                <div className="rounded-lg border border-line bg-bone p-3.5">
                  <div className="font-display text-[18px] font-extrabold tracking-tight text-ink">{brl(ticketMedio)}</div>
                  <div className="mt-0.5 text-[11px] text-mute">Ticket médio</div>
                </div>
                <div className="rounded-lg border border-line bg-bone p-3.5">
                  <div className="font-display text-[20px] font-extrabold tracking-tight text-ink">{pedidos.length}</div>
                  <div className="mt-0.5 text-[11px] text-mute">Pedidos no total</div>
                </div>
                <div className="rounded-lg border border-line bg-bone p-3.5">
                  <div className="font-display text-[20px] font-extrabold tracking-tight text-ink">{(porStatus["recebido"] || 0) + (porStatus["separacao"] || 0)}</div>
                  <div className="mt-0.5 text-[11px] text-mute">Em andamento</div>
                </div>
              </div>

              {/* lista de pedidos do cliente */}
              <div className="mono-label mb-2 text-ink/55">Todos os pedidos deste cliente ({pedidos.length})</div>
              <div className="space-y-2.5">
                {pedidos.map((p) => (
                  <div key={p.ordem_venda} className={`overflow-hidden rounded-lg border bg-white transition ${ovAberta === p.ordem_venda ? "border-accent shadow-card" : "border-line"}`}>
                    <button onClick={() => abrirDetalhe(p.ordem_venda)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition hover:bg-bone">
                      <span className="font-display text-[13.5px] font-extrabold text-ink">#{p.ordem_venda}</span>
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${STATUS_COR[p.status] || "bg-slate-100 text-slate-700"}`}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                      {p.nota_fiscal && <span className="text-[12px] text-mute">NF {p.nota_fiscal}</span>}
                      <span className="ml-auto text-[13.5px] font-semibold text-ink">{brl(p.valor_fatura || p.valor_ov)}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={`text-ink/35 ${ovAberta === p.ordem_venda ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
                    </button>

                    {ovAberta === p.ordem_venda && (
                      <div className="border-t border-line bg-bone px-4 py-4">
                        {/* dados da ordem */}
                        <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                          {[
                            ["Criação", dataBR(p.data_criacao)],
                            ["Emissão", dataBR(p.data_emissao)],
                            ["Expedição", dataBR(p.data_expedicao)],
                            ["Qtd solic./atend.", `${p.qtde_solicitada ?? "—"} / ${p.qtde_atendida ?? "—"}`],
                            ["Depósito (CD)", p.deposito || "—"],
                            ["Transportadora", p.transportadora || "—"],
                            ["Duplicata", p.duplicata || "—"],
                            ["Status origem", p.status_origem || "—"],
                            ["Status legado", p.status_legado || "—"],
                          ].map(([k, v]) => (
                            <div key={k as string}>
                              <div className="text-[10.5px] uppercase tracking-wide text-ink/40">{k}</div>
                              <div className="text-[12.5px] font-semibold text-ink">{v}</div>
                            </div>
                          ))}
                        </div>

                        {carregandoDetalhe ? (
                          <p className="text-[12.5px] text-mute">Buscando a nota...</p>
                        ) : notaFull ? (
                          <>
                            {/* dados da nota */}
                            <div className="mb-3 rounded border border-line bg-white p-3">
                              <div className="mono-label mb-1.5 text-accent-deep">Nota fiscal {notaFull.numero}</div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] sm:grid-cols-3">
                                <span className="text-mute">CNPJ: <b className="text-ink">{cnpjFmt(notaFull.dest_cnpj)}</b></span>
                                <span className="text-mute">Cidade: <b className="text-ink">{notaFull.dest_municipio || "—"}</b></span>
                                <span className="text-mute">Fone: <b className="text-ink">{notaFull.dest_fone || "—"}</b></span>
                                <span className="text-mute">Volumes: <b className="text-ink">{notaFull.volumes ?? "—"}</b></span>
                                <span className="text-mute">Peso: <b className="text-ink">{notaFull.peso_bruto ? `${notaFull.peso_bruto} kg` : "—"}</b></span>
                                <span className="text-mute">Valor: <b className="text-ink">{brl(notaFull.valor_total)}</b></span>
                              </div>
                            </div>

                            {/* itens */}
                            <div className="mb-3 overflow-hidden rounded border border-line bg-white">
                              <div className="hidden bg-ink/95 px-3 py-2 text-paper sm:grid sm:grid-cols-[1fr_120px_50px_90px]">
                                <span className="mono-label">Produto</span><span className="mono-label">EAN</span>
                                <span className="mono-label text-right">Qtd</span><span className="mono-label text-right">Valor</span>
                              </div>
                              <div className="divide-y divide-line">
                                {itens.map((it, i) => (
                                  <div key={i} className="grid gap-0.5 px-3 py-2 sm:grid-cols-[1fr_120px_50px_90px] sm:items-center sm:gap-2">
                                    <span className="text-[12px] text-ink">{it.descricao || it.codigo}</span>
                                    <span className="font-mono text-[11px] text-mute">{it.ean || "—"}</span>
                                    <span className="text-[11.5px] text-mute sm:text-right">{it.quantidade}</span>
                                    <span className="text-[12px] font-semibold text-ink sm:text-right">{brl(it.valor_total)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* boletos */}
                            {dups.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {dups.map((d, i) => (
                                  <span key={i} className="rounded border border-line bg-white px-2.5 py-1.5 text-[11.5px]">
                                    <b className="text-ink">Parc. {d.parcela}</b>
                                    <span className="mx-1 text-ink/30">·</span>
                                    <span className="text-mute">{dataBR(d.vencimento)}</span>
                                    <span className="mx-1 text-ink/30">·</span>
                                    <b className="text-accent-deep">{brl(d.valor)}</b>
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-[12.5px] text-mute">
                            Sem nota (XML) vinculada a este pedido ainda. Quando o XML dessa nota for importado,
                            os itens e boletos aparecem aqui.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
