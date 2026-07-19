"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import ClienteModal from "@/components/admin/ClienteModal";
import FaturamentoDashboard from "@/components/admin/FaturamentoDashboard";
import { supabaseBrowser } from "@/lib/supabase";
import { lerRelatorio, lerXmlNfe, STATUS_LABEL, STATUS_COR, type PedidoImportado } from "@/lib/parsers";

type Linha = {
  ordem_venda: string; cliente_nome: string | null; uf: string | null; deposito: string | null;
  valor_ov: number | null; valor_fatura: number | null; status: string; status_origem: string | null;
  nota_fiscal: string | null; data_criacao: string | null; data_emissao: string | null;
  data_expedicao: string | null; transportadora: string | null;
};
type NotaLinha = {
  id: string; numero: string | null; ordem_venda: string | null; emissao: string | null;
  valor_total: number | null; dest_nome: string | null; dest_cnpj: string | null; dest_uf: string | null; transportadora: string | null;
};
type ItemNota = { item: number | null; codigo: string | null; ean: string | null; descricao: string | null; quantidade: number | null; valor_total: number | null };
type DupNota = { parcela: string | null; vencimento: string | null; valor: number | null };
type Importacao = { id: string; tipo: string; arquivo: string | null; deposito: string | null; registros: number | null; novos: number | null; atualizados: number | null; criado_em: string };

const ORDEM_STATUS = ["recebido", "separacao", "faturado", "despachado", "cancelado"];
const brl = (v: number | null | undefined) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (v: string | null) => { if (!v) return "—"; const d = v.slice(0, 10); const [a, m, dia] = d.split("-"); return dia ? `${dia}/${m}/${a}` : v; };
const dataHora = (v: string | null) => { if (!v) return "—"; const dt = new Date(v); if (isNaN(dt.getTime())) return v; return dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); };
const faltaTabela = (m?: string) => /could not find the table|does not exist|schema cache|relation .* does not exist/i.test(m || "");
type Ordenacao = "recentes" | "antigos" | "maior_valor" | "menor_valor" | "cliente_az";
const POR_PAGINA = 50;

// O Supabase corta em 1000 linhas por requisição (limite do PostgREST).
// Esta função busca em blocos de 1000 usando .range() até trazer tudo.
async function buscarTudo<T>(tabela: string, colunas: string, ordemUnica: string): Promise<T[]> {
  if (!supabaseBrowser) return [];
  const passo = 1000;
  const tudo: T[] = [];
  for (let offset = 0; ; offset += passo) {
    const { data, error } = await supabaseBrowser
      .from(tabela).select(colunas)
      .order(ordemUnica, { ascending: true })
      .range(offset, offset + passo - 1);
    if (error) { if (faltaTabela(error.message)) throw { faltaTabela: true }; break; }
    const lote = (data as T[]) || [];
    tudo.push(...lote);
    if (lote.length < passo) break;
    if (offset > 100000) break; // guarda de segurança
  }
  return tudo;
}

const PORTES: Record<string, { label: string; min: number; max: number | null }> = {
  pequeno: { label: "Pequeno (até R$ 1.500)", min: 0, max: 1500 },
  medio: { label: "Médio (R$ 1.500 – 3.000)", min: 1500, max: 3000 },
  grande: { label: "Grande (R$ 3.000 – 6.000)", min: 3000, max: 6000 },
  mgrande: { label: "Muito grande (+R$ 6.000)", min: 6000, max: null },
};

/* paginação reutilizável */
function Paginacao({ pagina, total, porPagina, onChange }: { pagina: number; total: number; porPagina: number; onChange: (p: number) => void }) {
  const totalPags = Math.max(1, Math.ceil(total / porPagina));
  if (totalPags <= 1) return null;
  const ini = (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);
  const paginas: (number | string)[] = [];
  const push = (p: number | string) => paginas.push(p);
  push(1);
  if (pagina > 3) push("…");
  for (let p = Math.max(2, pagina - 1); p <= Math.min(totalPags - 1, pagina + 1); p++) push(p);
  if (pagina < totalPags - 2) push("…");
  if (totalPags > 1) push(totalPags);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-bone px-4 py-3">
      <span className="text-[12.5px] text-mute">{ini}–{fim} de {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(pagina - 1)} disabled={pagina <= 1} className="mono-label rounded border border-line bg-white px-3 py-2 text-ink/60 transition hover:text-ink disabled:opacity-40">‹</button>
        {paginas.map((p, i) => p === "…" ? (
          <span key={`e${i}`} className="px-2 text-ink/30">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p as number)} className={`mono-label min-w-[36px] rounded px-3 py-2 transition ${p === pagina ? "bg-ink text-paper" : "border border-line bg-white text-ink/60 hover:text-ink"}`}>{p}</button>
        ))}
        <button onClick={() => onChange(pagina + 1)} disabled={pagina >= totalPags} className="mono-label rounded border border-line bg-white px-3 py-2 text-ink/60 transition hover:text-ink disabled:opacity-40">›</button>
      </div>
    </div>
  );
}

export default function AdminFaturamento() {
  const [aba, setAba] = useState<"visao" | "pedidos" | "notas" | "clientes" | "importacoes">("visao");
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [notas, setNotas] = useState<NotaLinha[]>([]);
  const [importacoes, setImportacoes] = useState<Importacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState<{ atual: number; total: number } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const [precisaSql, setPrecisaSql] = useState(false);
  const [clienteModal, setClienteModal] = useState<{ cliente: string; ordem?: string | null } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // filtros pedidos
  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState<string[]>([]);
  const [fUF, setFUF] = useState(""); const [fCD, setFCD] = useState("");
  const [fValMin, setFValMin] = useState(""); const [fValMax, setFValMax] = useState("");
  const [fDe, setFDe] = useState(""); const [fAte, setFAte] = useState("");
  const [fCampoData, setFCampoData] = useState<"data_criacao" | "data_emissao" | "data_expedicao">("data_criacao");
  const [fPorte, setFPorte] = useState("");
  const [ordenar, setOrdenar] = useState<Ordenacao>("recentes");
  const [maisFiltros, setMaisFiltros] = useState(false);
  const [pagina, setPagina] = useState(1);

  // clientes ABC
  const [buscaCli, setBuscaCli] = useState("");
  const [fClasse, setFClasse] = useState<string[]>([]);
  const [ordCli, setOrdCli] = useState<"total" | "ticket" | "pedidos" | "az">("total");

  // notas
  const [buscaNota, setBuscaNota] = useState("");
  const [paginaNota, setPaginaNota] = useState(1);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const [selNotas, setSelNotas] = useState<Set<string>>(new Set());
  const [detalhes, setDetalhes] = useState<Record<string, { itens: ItemNota[]; dups: DupNota[] }>>({});

  const carregar = useCallback(async () => {
    if (!supabaseBrowser) return setCarregando(false);
    setPrecisaSql(false); setCarregando(true);
    try {
      const [ov, n, imp] = await Promise.all([
        buscarTudo<Linha>("ordens_venda", "ordem_venda,cliente_nome,uf,deposito,valor_ov,valor_fatura,status,status_origem,nota_fiscal,data_criacao,data_emissao,data_expedicao,transportadora", "ordem_venda"),
        buscarTudo<NotaLinha>("notas", "id,numero,ordem_venda,emissao,valor_total,dest_nome,dest_cnpj,dest_uf,transportadora", "id"),
        supabaseBrowser.from("importacoes").select("id,tipo,arquivo,deposito,registros,novos,atualizados,criado_em").order("criado_em", { ascending: false }).limit(1000),
      ]);
      n.sort((a, b) => (b.emissao || "").localeCompare(a.emissao || ""));
      setLinhas(ov); setNotas(n); setImportacoes((imp.data as Importacao[]) || []);
    } catch (e: any) {
      if (e?.faltaTabela) setPrecisaSql(true);
    }
    setCarregando(false);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);
  function addLog(s: string) { setLog((p) => [s, ...p].slice(0, 60)); }

  async function carregarDetalhe(id: string) {
    if (detalhes[id] || !supabaseBrowser) return;
    const [ri, rd] = await Promise.all([
      supabaseBrowser.from("nota_itens").select("item,codigo,ean,descricao,quantidade,valor_total").eq("nota_id", id).order("item"),
      supabaseBrowser.from("nota_duplicatas").select("parcela,vencimento,valor").eq("nota_id", id).order("vencimento"),
    ]);
    setDetalhes((p) => ({ ...p, [id]: { itens: (ri.data as ItemNota[]) || [], dups: (rd.data as DupNota[]) || [] } }));
  }
  async function toggleExpand(id: string) {
    setExpandidas((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    carregarDetalhe(id);
  }
  function toggleSel(id: string) {
    setSelNotas((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  async function expandirSelecionadas() {
    const ids = [...selNotas];
    setExpandidas(new Set(ids));
    for (const id of ids) await carregarDetalhe(id);
  }

  async function excluirImportacao(id: string, arquivo: string | null) {
    if (!supabaseBrowser) return;
    if (!confirm(`Remover o registro de importação de "${arquivo || "arquivo"}"?\n\nIsso apaga só o item desta lista de histórico. Os pedidos e notas já importados continuam no sistema.`)) return;
    const { error } = await supabaseBrowser.from("importacoes").delete().eq("id", id);
    if (error) { alert("Não consegui remover: " + error.message); return; }
    setImportacoes((p) => p.filter((i) => i.id !== id));
  }

  async function removerDuplicados() {
    if (!supabaseBrowser) return;
    const vistos = new Set<string>(); const remover: string[] = [];
    // a lista já vem do mais recente pro mais antigo — mantém o 1º de cada arquivo+tipo
    for (const i of importacoes) {
      const chave = `${i.tipo}::${(i.arquivo || "").toLowerCase()}`;
      if (vistos.has(chave)) remover.push(i.id); else vistos.add(chave);
    }
    if (remover.length === 0) { alert("Nenhum arquivo duplicado encontrado."); return; }
    if (!confirm(`Encontrei ${remover.length} registro(s) duplicado(s). Remover, mantendo a importação mais recente de cada arquivo?`)) return;
    const { error } = await supabaseBrowser.from("importacoes").delete().in("id", remover);
    if (error) { alert("Erro ao limpar: " + error.message); return; }
    setImportacoes((p) => p.filter((i) => !remover.includes(i.id)));
  }

  /* ---------- importação ---------- */
  async function processar(files: FileList | File[]) {
    if (!supabaseBrowser) return addLog("Supabase não configurado.");
    const arr = Array.from(files);
    setProcessando(true);
    setProgresso({ atual: 0, total: arr.length });
    let idx = 0;
    for (const file of arr) {
      idx++; setProgresso({ atual: idx, total: arr.length });
      const nome = file.name;
      const ehXml = /\.xml$/i.test(nome), ehPlanilha = /\.(xlsx?|csv)$/i.test(nome);
      try {
        if (ehPlanilha) {
          const registros: PedidoImportado[] = await lerRelatorio(file);
          if (registros.length === 0) { addLog(`⚠ ${nome}: nenhuma linha reconhecida.`); continue; }
          let ok = 0;
          for (let i = 0; i < registros.length; i += 400) {
            const lote = registros.slice(i, i + 400);
            const { error } = await supabaseBrowser.from("ordens_venda").upsert(lote, { onConflict: "ordem_venda" });
            if (error) throw error; ok += lote.length;
          }
          await supabaseBrowser.from("importacoes").insert({ tipo: "relatorio", arquivo: nome, registros: registros.length, atualizados: ok, deposito: registros[0]?.deposito ?? null });
          addLog(`✓ RELATÓRIO ${nome}: ${ok} pedidos.`);
        } else if (ehXml) {
          const { nota, itens, duplicatas } = await lerXmlNfe(file);
          if (!nota.chave && !nota.numero) { addLog(`⚠ ${nome}: não parece uma NF-e.`); continue; }
          const { data: notaSalva, error: e1 } = await supabaseBrowser.from("notas").upsert(nota, { onConflict: "chave" }).select("id").single();
          if (e1) throw e1;
          const notaId = (notaSalva as { id: string }).id;
          await supabaseBrowser.from("nota_itens").delete().eq("nota_id", notaId);
          if (itens.length) { const { error: e2 } = await supabaseBrowser.from("nota_itens").insert(itens.map((i) => ({ ...i, nota_id: notaId, ordem_venda: nota.ordem_venda }))); if (e2) throw e2; }
          await supabaseBrowser.from("nota_duplicatas").delete().eq("nota_id", notaId);
          if (duplicatas.length) { const { error: e3 } = await supabaseBrowser.from("nota_duplicatas").insert(duplicatas.map((d) => ({ ...d, nota_id: notaId, ordem_venda: nota.ordem_venda }))); if (e3) throw e3; }
          await supabaseBrowser.from("importacoes").insert({ tipo: "xml", arquivo: nome, registros: itens.length, novos: 1 });
          setDetalhes((p) => { const n = { ...p }; delete n[notaId]; return n; });
          addLog(`✓ NOTA ${nota.numero || "?"} — cliente ${nota.dest_nome || "?"} · pedido ${nota.ordem_venda || "?"} · ${itens.length} itens · ${duplicatas.length} boleto(s) · ${brl(nota.valor_total)}`);
        } else addLog(`⚠ ${nome}: formato não suportado.`);
      } catch (e: any) {
        if (faltaTabela(e?.message)) { addLog(`✕ ${nome}: as tabelas ainda não foram criadas no Supabase.`); setPrecisaSql(true); }
        else addLog(`✕ ${nome}: ${e?.message || "falhou"}`);
      }
    }
    setProcessando(false); setProgresso(null);
    await carregar();
  }

  /* ---------- filtros / opções ---------- */
  const UFs = useMemo(() => Array.from(new Set(linhas.map((l) => l.uf).filter(Boolean))).sort() as string[], [linhas]);
  const CDs = useMemo(() => Array.from(new Set(linhas.map((l) => l.deposito).filter(Boolean))).sort() as string[], [linhas]);
  function limparFiltros() { setBusca(""); setFStatus([]); setFUF(""); setFCD(""); setFValMin(""); setFValMax(""); setFDe(""); setFAte(""); setFPorte(""); setOrdenar("recentes"); }
  const temFiltro = fStatus.length > 0 || fUF || fCD || fValMin || fValMax || fDe || fAte || fPorte || busca;

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const min = fValMin ? parseFloat(fValMin.replace(",", ".")) : null;
    const max = fValMax ? parseFloat(fValMax.replace(",", ".")) : null;
    let arr = linhas.filter((l) => {
      if (fStatus.length && !fStatus.includes(l.status)) return false;
      if (fUF && l.uf !== fUF) return false;
      if (fCD && l.deposito !== fCD) return false;
      const val = l.valor_fatura || l.valor_ov || 0;
      if (min !== null && val < min) return false;
      if (max !== null && val > max) return false;
      if (fPorte) { const p = PORTES[fPorte]; if (p && (val < p.min || (p.max !== null && val >= p.max))) return false; }
      const dt = (l[fCampoData] || "").slice(0, 10);
      if (fDe && (!dt || dt < fDe)) return false;
      if (fAte && (!dt || dt > fAte)) return false;
      if (q && ![l.ordem_venda, l.cliente_nome, l.nota_fiscal, l.uf, l.transportadora].filter(Boolean).join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
    const v = (l: Linha) => l.valor_fatura || l.valor_ov || 0;
    arr = [...arr].sort((a, b) => {
      switch (ordenar) {
        case "antigos": return (a.data_criacao || "").localeCompare(b.data_criacao || "");
        case "maior_valor": return v(b) - v(a);
        case "menor_valor": return v(a) - v(b);
        case "cliente_az": return (a.cliente_nome || "").localeCompare(b.cliente_nome || "");
        default: return (b.data_criacao || "").localeCompare(a.data_criacao || "");
      }
    });
    return arr;
  }, [linhas, busca, fStatus, fUF, fCD, fValMin, fValMax, fDe, fAte, fCampoData, fPorte, ordenar]);
  useEffect(() => { setPagina(1); }, [busca, fStatus, fUF, fCD, fValMin, fValMax, fDe, fAte, fPorte, ordenar]);

  // KPIs de valor por status
  const kpis = useMemo(() => {
    let ov = 0, faturado = 0, separacao = 0, cancelado = 0, qFat = 0, qPed = 0;
    for (const l of linhas) {
      const vov = l.valor_ov || 0, vf = l.valor_fatura || 0;
      if (l.status === "cancelado") { cancelado += vov; continue; }
      ov += vov; qPed++;
      if (l.status === "faturado" || l.status === "despachado") { faturado += vf; qFat++; }
      else separacao += vov;
    }
    const ticket = qPed > 0 ? ov / qPed : 0;
    return { ov, faturado, separacao, cancelado, qFat, qPed, ticket };
  }, [linhas]);

  const resumo = useMemo(() => {
    const r: Record<string, { qtde: number; valor: number }> = {};
    ORDEM_STATUS.forEach((s) => (r[s] = { qtde: 0, valor: 0 }));
    for (const l of linhas) {
      if (!r[l.status]) r[l.status] = { qtde: 0, valor: 0 };
      r[l.status].qtde++;
      r[l.status].valor += (l.status === "faturado" || l.status === "despachado") ? (l.valor_fatura || 0) : (l.valor_ov || 0);
    }
    return r;
  }, [linhas]);

  const pagPedidos = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  /* ---------- curva ABC ---------- */
  const curvaABC = useMemo(() => {
    const mapa = new Map<string, { cliente: string; uf: string | null; total: number; pedidos: number; ultimo: string | null }>();
    for (const l of linhas) {
      if (l.status === "cancelado") continue;
      const nome = l.cliente_nome || "—"; const val = l.valor_fatura || l.valor_ov || 0;
      const cur = mapa.get(nome) || { cliente: nome, uf: l.uf, total: 0, pedidos: 0, ultimo: null };
      cur.total += val; cur.pedidos += 1;
      if (!cur.ultimo || (l.data_criacao || "") > cur.ultimo) cur.ultimo = l.data_criacao;
      mapa.set(nome, cur);
    }
    const lista = Array.from(mapa.values()).sort((a, b) => b.total - a.total);
    const totalGeral = lista.reduce((s, c) => s + c.total, 0) || 1;
    let acum = 0;
    return lista.map((c) => {
      acum += c.total;
      const pctAcum = (acum / totalGeral) * 100, pctInd = (c.total / totalGeral) * 100;
      const classe = pctAcum <= 80 ? "A" : pctAcum <= 95 ? "B" : "C";
      const ticket = c.pedidos > 0 ? c.total / c.pedidos : 0;
      return { ...c, pctInd, pctAcum, classe, ticket };
    });
  }, [linhas]);
  const resumoABC = useMemo(() => {
    const r: Record<string, { qtde: number; total: number }> = { A: { qtde: 0, total: 0 }, B: { qtde: 0, total: 0 }, C: { qtde: 0, total: 0 } };
    for (const c of curvaABC) { r[c.classe].qtde++; r[c.classe].total += c.total; } return r;
  }, [curvaABC]);
  const clientesFiltrados = useMemo(() => {
    const q = buscaCli.trim().toLowerCase();
    const arr = curvaABC.filter((c) => { if (fClasse.length && !fClasse.includes(c.classe)) return false; if (q && !c.cliente.toLowerCase().includes(q)) return false; return true; });
    return [...arr].sort((a, b) => { switch (ordCli) { case "ticket": return b.ticket - a.ticket; case "pedidos": return b.pedidos - a.pedidos; case "az": return a.cliente.localeCompare(b.cliente); default: return b.total - a.total; } });
  }, [curvaABC, buscaCli, fClasse, ordCli]);
  const ticketMedioGeral = useMemo(() => { const t = curvaABC.reduce((s, c) => s + c.total, 0), p = curvaABC.reduce((s, c) => s + c.pedidos, 0); return p > 0 ? t / p : 0; }, [curvaABC]);

  /* ---------- notas ---------- */
  const notasFiltradas = useMemo(() => {
    const q = buscaNota.trim().toLowerCase();
    if (!q) return notas;
    return notas.filter((n) => [n.numero, n.ordem_venda, n.dest_nome, n.dest_cnpj, n.dest_uf].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [notas, buscaNota]);
  useEffect(() => { setPaginaNota(1); }, [buscaNota]);
  const pagNotas = notasFiltradas.slice((paginaNota - 1) * POR_PAGINA, paginaNota * POR_PAGINA);
  const totalNotas = useMemo(() => notas.reduce((s, n) => s + (n.valor_total || 0), 0), [notas]);
  const selArr = useMemo(() => notas.filter((n) => selNotas.has(n.id)), [notas, selNotas]);
  const totalSel = useMemo(() => selArr.reduce((s, n) => s + (n.valor_total || 0), 0), [selArr]);

  const sel = "rounded border border-line bg-white px-3 py-2.5 text-[13px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink">Faturamento e status</h1>
        <p className="mt-1 text-[14px] text-mute">Solte os relatórios dos CDs e os XMLs. Clique em qualquer pedido pra ver a ficha completa do cliente.</p>
      </div>

      {precisaSql && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-5">
          <p className="font-display text-[15px] font-extrabold text-amber-900">As tabelas ainda não foram criadas no Supabase</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-amber-800">Rode o <b>SUPABASE-automacao.sql</b> (SQL Editor → colar → Run), depois clique em Atualizar.</p>
        </div>
      )}

      {/* IMPORTAR */}
      <div onDragOver={(e) => { e.preventDefault(); setArrastando(true); }} onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); processar(e.dataTransfer.files); }} onClick={() => inputRef.current?.click()}
        className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition ${arrastando ? "border-accent bg-accent/5" : "border-line bg-white hover:border-accent/50"}`}>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></svg>
        </div>
        <p className="font-display text-[14.5px] font-extrabold tracking-tight text-ink">
          {processando && progresso ? `Processando ${progresso.atual} de ${progresso.total}...` : "Arraste relatórios (.xls) e XMLs aqui"}
        </p>
        <p className="mt-0.5 text-[12.5px] text-mute">vários de uma vez — dos 3 CDs juntos</p>
        <input ref={inputRef} type="file" multiple accept=".xls,.xlsx,.csv,.xml" className="hidden" onChange={(e) => e.target.files && processar(e.target.files)} />
      </div>

      {log.length > 0 && (
        <div className="mb-6 rounded-lg border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="mono-label text-ink/55">Registro de importações</span>
            <button onClick={() => setLog([])} className="mono-label text-ink/40 transition hover:text-ink">limpar</button>
          </div>
          <div className="max-h-48 overflow-y-auto p-4">
            {log.map((l, i) => (<p key={i} className={`text-[12.5px] leading-relaxed ${l.startsWith("✓") ? "text-emerald-700" : l.startsWith("✕") ? "text-red-600" : "text-amber-700"}`}>{l}</p>))}
          </div>
        </div>
      )}

      {/* TOGGLE */}
      <div className="mb-5 inline-flex flex-wrap rounded-lg border border-line bg-white p-1">
        {[{ k: "visao" as const, t: "Visão geral" }, { k: "pedidos" as const, t: `Pedidos (${linhas.length})` }, { k: "notas" as const, t: `Notas / XML (${notas.length})` }, { k: "clientes" as const, t: `Clientes · Curva ABC (${curvaABC.length})` }, { k: "importacoes" as const, t: `Importações (${importacoes.length})` }].map((o) => (
          <button key={o.k} onClick={() => setAba(o.k)} className={`mono-label rounded px-4 py-2.5 transition ${aba === o.k ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"}`}>{o.t}</button>
        ))}
      </div>

      {/* ============ ABA VISÃO GERAL ============ */}
      {aba === "visao" && (
        carregando ? <p className="text-[14px] text-mute">Carregando...</p> : <FaturamentoDashboard linhas={linhas} />
      )}

      {/* ============ ABA PEDIDOS ============ */}
      {aba === "pedidos" && (
        <>
          {/* KPIs de valor */}
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg border border-line bg-ink p-4 text-paper">
              <div className="font-display text-[19px] font-extrabold tracking-tight">{brl(kpis.ov)}</div>
              <div className="mt-0.5 text-[11px] text-paper/60">Valor em pedidos (OV)</div>
            </div>
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
              <div className="font-display text-[19px] font-extrabold tracking-tight text-accent-deep">{brl(kpis.ticket)}</div>
              <div className="mt-0.5 text-[11px] text-accent-deep/70">Ticket médio por OV</div>
            </div>
            <div className="rounded-lg border border-line bg-white p-4">
              <div className="font-display text-[19px] font-extrabold tracking-tight text-ink">{kpis.qPed.toLocaleString("pt-BR")}</div>
              <div className="mt-0.5 text-[11px] text-mute">Qtde de pedidos (OV)</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="font-display text-[19px] font-extrabold tracking-tight text-emerald-700">{brl(kpis.faturado)}</div>
              <div className="mt-0.5 text-[11px] text-emerald-700/70">Faturado ({kpis.qFat} notas)</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="font-display text-[19px] font-extrabold tracking-tight text-amber-700">{brl(kpis.separacao)}</div>
              <div className="mt-0.5 text-[11px] text-amber-700/70">Em andamento (a faturar)</div>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="font-display text-[19px] font-extrabold tracking-tight text-red-600">{brl(kpis.cancelado)}</div>
              <div className="mt-0.5 text-[11px] text-red-600/70">Cancelado</div>
            </div>
          </div>

          {/* cartões de status (filtram) — com qtde e valor. O "faturado" some quando está zerado (tudo já foi despachado). */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {ORDEM_STATUS.filter((s) => !(s === "faturado" && (resumo[s]?.qtde || 0) === 0)).map((s) => {
              const on = fStatus.includes(s);
              return (
                <button key={s} onClick={() => setFStatus((p) => on ? p.filter((x) => x !== s) : [...p, s])}
                  className={`rounded-lg border p-3.5 text-left transition ${on ? "border-accent bg-accent/5 ring-1 ring-accent/30" : "border-line bg-white hover:border-accent/50"}`}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-[20px] font-extrabold tracking-tight text-ink">{resumo[s].qtde}</span>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${STATUS_COR[s]}`}>{STATUS_LABEL[s]}</span>
                  </div>
                  <div className="mt-1 text-[12px] font-semibold text-mute">{brl(resumo[s].valor)}</div>
                </button>
              );
            })}
          </div>

          {/* filtros */}
          <div className="mb-4 rounded-lg border border-line bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-3 text-ink/35"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por cliente, ordem, nota, transportadora..."
                  className="w-full rounded border border-line bg-white py-2.5 pl-9 pr-3 text-[13.5px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
              </div>
              <select value={ordenar} onChange={(e) => setOrdenar(e.target.value as Ordenacao)} className={sel}>
                <option value="recentes">Mais recentes</option><option value="antigos">Mais antigos</option>
                <option value="maior_valor">Maior valor</option><option value="menor_valor">Menor valor</option><option value="cliente_az">Cliente A–Z</option>
              </select>
              <button onClick={() => setMaisFiltros((v) => !v)} className={`mono-label inline-flex items-center gap-2 rounded border px-3.5 py-2.5 transition ${maisFiltros ? "border-accent text-accent-deep" : "border-line text-ink/60 hover:text-ink"}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>Filtros
              </button>
              {temFiltro && <button onClick={limparFiltros} className="mono-label rounded border border-line px-3.5 py-2.5 text-ink/60 transition hover:text-red-600">Limpar</button>}
            </div>
            {maisFiltros && (
              <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink/45">UF</label>
                  <select value={fUF} onChange={(e) => setFUF(e.target.value)} className={`${sel} w-full`}><option value="">Todas</option>{UFs.map((u) => <option key={u} value={u}>{u}</option>)}</select></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink/45">Depósito (CD)</label>
                  <select value={fCD} onChange={(e) => setFCD(e.target.value)} className={`${sel} w-full`}><option value="">Todos</option>{CDs.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink/45">Porte do pedido</label>
                  <select value={fPorte} onChange={(e) => setFPorte(e.target.value)} className={`${sel} w-full`}><option value="">Qualquer</option>{Object.entries(PORTES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink/45">Valor exato (R$)</label>
                  <div className="flex gap-2"><input value={fValMin} onChange={(e) => setFValMin(e.target.value)} placeholder="mín" inputMode="decimal" className={`${sel} w-full`} /><input value={fValMax} onChange={(e) => setFValMax(e.target.value)} placeholder="máx" inputMode="decimal" className={`${sel} w-full`} /></div></div>
                <div className="lg:col-span-2"><label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink/45">
                  Período por
                  <select value={fCampoData} onChange={(e) => setFCampoData(e.target.value as any)} className="ml-1 border-0 bg-transparent p-0 text-[11px] font-bold uppercase text-accent-deep outline-none">
                    <option value="data_criacao">criação</option><option value="data_emissao">emissão</option><option value="data_expedicao">expedição</option></select></label>
                  <div className="flex gap-2"><input type="date" value={fDe} onChange={(e) => setFDe(e.target.value)} className={`${sel} w-full`} /><input type="date" value={fAte} onChange={(e) => setFAte(e.target.value)} className={`${sel} w-full`} /></div></div>
              </div>
            )}
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="mono-label text-ink/55">
              {filtradas.length} resultado(s){temFiltro ? ` de ${linhas.length}` : ""}
              {CDs.length > 0 && <span className="ml-2 text-ink/35">· {CDs.length} depósito(s): {CDs.join(", ")}</span>}
            </span>
            <button onClick={carregar} className="mono-label rounded border border-line px-3 py-2 text-ink/60 transition hover:text-ink">Atualizar</button>
          </div>

          {carregando ? <p className="text-[14px] text-mute">Carregando...</p> : filtradas.length === 0 ? (
            <div className="rounded-lg border border-line bg-white p-10 text-center shadow-card">
              <p className="font-display text-[15px] font-extrabold text-ink">{linhas.length === 0 ? "Nenhum pedido importado ainda" : "Nada encontrado com esses filtros"}</p>
              <p className="mt-1 text-[13px] text-mute">{linhas.length === 0 ? "Solte o relatório do CD na área acima." : "Ajuste ou limpe os filtros."}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
              <div className="hidden bg-ink px-4 py-3 text-paper lg:grid lg:grid-cols-[95px_1fr_130px_100px_110px_115px]">
                <span className="mono-label">Ordem</span><span className="mono-label">Cliente</span><span className="mono-label">Status</span><span className="mono-label">Nota</span><span className="mono-label text-right">Valor</span><span className="mono-label text-right">Expedição</span>
              </div>
              <div className="divide-y divide-line">
                {pagPedidos.map((l) => (
                  <button key={l.ordem_venda} onClick={() => setClienteModal({ cliente: l.cliente_nome || "", ordem: l.ordem_venda })}
                    className="grid w-full gap-1 px-4 py-3.5 text-left transition hover:bg-bone lg:grid-cols-[95px_1fr_130px_100px_110px_115px] lg:items-center lg:gap-3">
                    <span className="font-display text-[13.5px] font-extrabold text-accent-deep">{l.ordem_venda}</span>
                    <span className="text-[13.5px] font-medium text-ink">{l.cliente_nome || "—"}<span className="ml-1.5 text-[11.5px] text-mute">{l.uf}</span></span>
                    <span><span className={`inline-block rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${STATUS_COR[l.status] || "bg-slate-100 text-slate-700"}`}>{STATUS_LABEL[l.status] || l.status}</span></span>
                    <span className="text-[12.5px] text-mute">{l.nota_fiscal || "—"}</span>
                    <span className="text-[13px] font-semibold text-ink lg:text-right">{brl(l.valor_fatura || l.valor_ov)}</span>
                    <span className="text-[12.5px] text-mute lg:text-right">{dataBR(l.data_expedicao)}</span>
                  </button>
                ))}
              </div>
              <Paginacao pagina={pagina} total={filtradas.length} porPagina={POR_PAGINA} onChange={setPagina} />
            </div>
          )}
        </>
      )}

      {/* ============ ABA NOTAS ============ */}
      {aba === "notas" && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-line bg-ink p-4 text-paper"><div className="font-display text-[19px] font-extrabold tracking-tight">{brl(totalNotas)}</div><div className="mt-0.5 text-[11px] text-paper/60">Valor total faturado</div></div>
            <div className="rounded-lg border border-line bg-white p-4"><div className="font-display text-[22px] font-extrabold tracking-tight text-ink">{notas.length}</div><div className="mt-0.5 text-[11px] text-mute">Notas importadas</div></div>
            <div className="rounded-lg border border-line bg-white p-4"><div className="font-display text-[22px] font-extrabold tracking-tight text-ink">{notas.filter((n) => n.ordem_venda).length}</div><div className="mt-0.5 text-[11px] text-mute">Com pedido vinculado</div></div>
            <div className="rounded-lg border border-line bg-white p-4"><div className="font-display text-[22px] font-extrabold tracking-tight text-ink">{new Set(notas.map((n) => n.dest_cnpj).filter(Boolean)).size}</div><div className="mt-0.5 text-[11px] text-mute">Clientes diferentes</div></div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input value={buscaNota} onChange={(e) => setBuscaNota(e.target.value)} placeholder="Buscar por nota, pedido, cliente ou CNPJ..."
              className="min-w-[240px] flex-1 rounded border border-line bg-white px-4 py-3 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
            <button onClick={() => { const ids = pagNotas.map((n) => n.id); setSelNotas((p) => { const n = new Set(p); const todas = ids.every((i) => n.has(i)); ids.forEach((i) => todas ? n.delete(i) : n.add(i)); return n; }); }}
              className="mono-label rounded border border-line px-4 py-3 text-ink/60 transition hover:text-ink">Selecionar página</button>
            <button onClick={carregar} className="mono-label rounded border border-line px-4 py-3 text-ink/60 transition hover:text-ink">Atualizar</button>
          </div>

          {/* barra de selecionadas */}
          {selNotas.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
              <span className="mono-label text-accent-deep">{selNotas.size} nota(s) selecionada(s) · {brl(totalSel)}</span>
              <button onClick={expandirSelecionadas} className="mono-label rounded bg-accent px-3.5 py-2 text-paper transition hover:bg-accent-bright">Ver itens das selecionadas</button>
              <button onClick={() => setSelNotas(new Set())} className="mono-label rounded border border-line bg-white px-3.5 py-2 text-ink/60 transition hover:text-ink">Limpar seleção</button>
            </div>
          )}

          {carregando ? <p className="text-[14px] text-mute">Carregando...</p> : notasFiltradas.length === 0 ? (
            <div className="rounded-lg border border-line bg-white p-10 text-center shadow-card">
              <p className="font-display text-[15px] font-extrabold text-ink">{notas.length === 0 ? "Nenhuma nota importada ainda" : "Nada encontrado"}</p>
              <p className="mt-1 text-[13px] text-mute">{notas.length === 0 ? "Solte um XML de NF-e na área acima." : "Tente outra busca."}</p>
            </div>
          ) : (
            <>
              <div className="mb-3 space-y-3">
                {pagNotas.map((n) => {
                  const det = detalhes[n.id];
                  const aberta = expandidas.has(n.id);
                  return (
                    <div key={n.id} className={`overflow-hidden rounded-lg border bg-white shadow-card transition ${selNotas.has(n.id) ? "border-accent" : "border-line"}`}>
                      <div className="flex flex-wrap items-center gap-3 p-4">
                        <input type="checkbox" checked={selNotas.has(n.id)} onChange={() => toggleSel(n.id)} onClick={(e) => e.stopPropagation()} className="h-4 w-4 flex-none accent-[#2563EB]" aria-label="Selecionar nota" />
                        <button onClick={() => toggleExpand(n.id)} className="flex flex-1 flex-wrap items-center gap-3 text-left">
                          <span className="flex h-10 w-10 flex-none items-center justify-center rounded bg-accent/10 text-accent"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3h8l4 4v14H4V3h4zM15 3v5h5M8 13h8M8 17h5" /></svg></span>
                          <div className="min-w-[180px] flex-1">
                            <div className="font-display text-[14.5px] font-extrabold tracking-tight text-ink">NF {n.numero || "—"}{n.ordem_venda && <span className="ml-2 rounded bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent-deep">pedido {n.ordem_venda}</span>}</div>
                            <div className="mt-0.5 text-[12.5px] text-mute">{n.dest_nome || "—"} · {n.dest_uf || ""} · {dataBR(n.emissao)}</div>
                          </div>
                          <span className="text-[14px] font-semibold text-ink">{brl(n.valor_total)}</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={`text-ink/35 ${aberta ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
                        </button>
                      </div>
                      {aberta && (
                        <div className="border-t border-line bg-bone px-4 py-4">
                          <div className="mb-4">
                            <div className="mono-label mb-2 text-ink/55">Itens ({det?.itens.length ?? "…"})</div>
                            <div className="overflow-hidden rounded border border-line bg-white">
                              <div className="hidden bg-ink/95 px-3 py-2 text-paper sm:grid sm:grid-cols-[1fr_130px_60px_100px]"><span className="mono-label">Produto</span><span className="mono-label">EAN</span><span className="mono-label text-right">Qtd</span><span className="mono-label text-right">Valor</span></div>
                              <div className="divide-y divide-line">
                                {!det ? <p className="px-3 py-3 text-[12.5px] text-mute">Carregando...</p> : det.itens.map((it, idx) => (
                                  <div key={idx} className="grid gap-0.5 px-3 py-2.5 sm:grid-cols-[1fr_130px_60px_100px] sm:items-center sm:gap-2">
                                    <span className="text-[12.5px] text-ink">{it.descricao || it.codigo}</span><span className="font-mono text-[11.5px] text-mute">{it.ean || "—"}</span>
                                    <span className="text-[12px] text-mute sm:text-right">{it.quantidade}</span><span className="text-[12.5px] font-semibold text-ink sm:text-right">{brl(it.valor_total)}</span>
                                  </div>))}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="mono-label mb-2 text-ink/55">Boletos ({det?.dups.length ?? "…"})</div>
                            <div className="flex flex-wrap gap-2">
                              {!det || det.dups.length === 0 ? <span className="text-[12.5px] text-mute">Sem duplicatas.</span> : det.dups.map((d, idx) => (
                                <span key={idx} className="rounded border border-line bg-white px-3 py-2 text-[12px]"><b className="text-ink">Parc. {d.parcela}</b><span className="mx-1.5 text-ink/30">·</span><span className="text-mute">venc. {dataBR(d.vencimento)}</span><span className="mx-1.5 text-ink/30">·</span><b className="text-accent-deep">{brl(d.valor)}</b></span>))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="overflow-hidden rounded-lg border border-line bg-white">
                <Paginacao pagina={paginaNota} total={notasFiltradas.length} porPagina={POR_PAGINA} onChange={setPaginaNota} />
              </div>
            </>
          )}
        </>
      )}

      {/* ============ ABA CLIENTES · CURVA ABC ============ */}
      {aba === "clientes" && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {([
              ["A", "Clientes A", "Os que fazem ~80% do faturamento", "border-emerald-300 bg-emerald-50", "text-emerald-700"],
              ["B", "Clientes B", "Faixa intermediária (~15%)", "border-amber-300 bg-amber-50", "text-amber-700"],
              ["C", "Clientes C", "Cauda longa (~5% final)", "border-slate-300 bg-slate-50", "text-slate-600"],
            ] as const).map(([cl, titulo, sub, borda, cor]) => {
              const on = fClasse.includes(cl);
              return (
                <button key={cl} onClick={() => setFClasse((p) => on ? p.filter((x) => x !== cl) : [...p, cl])} className={`rounded-lg border p-4 text-left transition ${borda} ${on ? "ring-2 ring-accent/40" : ""}`}>
                  <div className="flex items-baseline justify-between"><span className={`font-display text-[26px] font-extrabold tracking-tight ${cor}`}>{resumoABC[cl].qtde}</span><span className={`mono-label ${cor}`}>Classe {cl}</span></div>
                  <div className="mt-1 text-[12.5px] font-semibold text-ink">{titulo} · {brl(resumoABC[cl].total)}</div><div className="text-[11.5px] text-mute">{sub}</div>
                </button>
              );
            })}
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            <input value={buscaCli} onChange={(e) => setBuscaCli(e.target.value)} placeholder="Buscar cliente..." className="min-w-[220px] flex-1 rounded border border-line bg-white px-4 py-3 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
            <select value={ordCli} onChange={(e) => setOrdCli(e.target.value as any)} className="rounded border border-line bg-white px-3 py-3 text-[13px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20">
              <option value="total">Ordenar: maior total</option><option value="ticket">Ordenar: maior ticket médio</option><option value="pedidos">Ordenar: mais pedidos</option><option value="az">Ordenar: cliente A–Z</option>
            </select>
            {fClasse.length > 0 && <button onClick={() => setFClasse([])} className="mono-label rounded border border-line px-4 py-3 text-ink/60 transition hover:text-red-600">Limpar classe</button>}
            <span className="mono-label self-center text-ink/45">{clientesFiltrados.length} cliente(s) · ticket médio geral {brl(ticketMedioGeral)}</span>
          </div>
          {carregando ? <p className="text-[14px] text-mute">Carregando...</p> : clientesFiltrados.length === 0 ? (
            <div className="rounded-lg border border-line bg-white p-10 text-center shadow-card"><p className="font-display text-[15px] font-extrabold text-ink">{curvaABC.length === 0 ? "Importe pedidos pra ver a curva ABC" : "Nenhum cliente nessa classe"}</p></div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
              <div className="hidden bg-ink px-4 py-3 text-paper lg:grid lg:grid-cols-[44px_1fr_64px_125px_120px_70px_90px]">
                <span className="mono-label">#</span><span className="mono-label">Cliente</span><span className="mono-label text-center">Classe</span><span className="mono-label text-right">Total comprado</span><span className="mono-label text-right">Ticket médio</span><span className="mono-label text-right">Pedidos</span><span className="mono-label text-right">% acum.</span>
              </div>
              <div className="divide-y divide-line">
                {clientesFiltrados.slice(0, 500).map((c, i) => {
                  const corClasse = c.classe === "A" ? "bg-emerald-100 text-emerald-700" : c.classe === "B" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600";
                  const acima = c.ticket >= ticketMedioGeral;
                  return (
                    <button key={c.cliente} onClick={() => setClienteModal({ cliente: c.cliente })} className="grid w-full gap-1 px-4 py-3.5 text-left transition hover:bg-bone lg:grid-cols-[44px_1fr_64px_125px_120px_70px_90px] lg:items-center lg:gap-3">
                      <span className="mono-label text-ink/40">{i + 1}</span>
                      <span className="text-[13.5px] font-medium text-ink">{c.cliente}<span className="ml-1.5 text-[11.5px] text-mute">{c.uf}</span></span>
                      <span className="lg:text-center"><span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-extrabold ${corClasse}`}>{c.classe}</span></span>
                      <span className="text-[13.5px] font-semibold text-ink lg:text-right">{brl(c.total)}</span>
                      <span className={`text-[13px] font-semibold lg:text-right ${acima ? "text-emerald-700" : "text-mute"}`}>{brl(c.ticket)}</span>
                      <span className="text-[12.5px] text-mute lg:text-right">{c.pedidos}</span>
                      <span className="text-[12.5px] text-mute lg:text-right">{c.pctAcum.toFixed(1)}%</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ============ ABA IMPORTAÇÕES ============ */}
      {aba === "importacoes" && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-line bg-ink p-4 text-paper"><div className="font-display text-[22px] font-extrabold tracking-tight">{importacoes.length}</div><div className="mt-0.5 text-[11px] text-paper/60">Arquivos importados</div></div>
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4"><div className="font-display text-[22px] font-extrabold tracking-tight text-accent-deep">{importacoes.filter((i) => i.tipo === "xml").length}</div><div className="mt-0.5 text-[11px] text-accent-deep/70">XMLs de notas</div></div>
            <div className="rounded-lg border border-line bg-white p-4"><div className="font-display text-[22px] font-extrabold tracking-tight text-ink">{importacoes.filter((i) => i.tipo === "relatorio").length}</div><div className="mt-0.5 text-[11px] text-mute">Relatórios de CD</div></div>
            <div className="rounded-lg border border-line bg-white p-4"><div className="font-display text-[22px] font-extrabold tracking-tight text-ink">{importacoes[0] ? dataHora(importacoes[0].criado_em).split(" ")[0] : "—"}</div><div className="mt-0.5 text-[11px] text-mute">Última importação</div></div>
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="mono-label text-ink/55">Histórico completo — cada arquivo que entrou no sistema</span>
            <div className="flex items-center gap-2">
              <button onClick={removerDuplicados} className="mono-label rounded border border-line px-3 py-2 text-ink/60 transition hover:border-red-300 hover:text-red-600">Remover duplicados</button>
              <button onClick={carregar} className="mono-label rounded border border-line px-3 py-2 text-ink/60 transition hover:text-ink">Atualizar</button>
            </div>
          </div>

          {carregando ? <p className="text-[14px] text-mute">Carregando...</p> : importacoes.length === 0 ? (
            <div className="rounded-lg border border-line bg-white p-10 text-center shadow-card">
              <p className="font-display text-[15px] font-extrabold text-ink">Nenhum arquivo importado ainda</p>
              <p className="mt-1 text-[13px] text-mute">Assim que você soltar relatórios ou XMLs na área de cima, cada um aparece aqui com data e hora.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
              <div className="hidden bg-ink px-4 py-3 text-paper lg:grid lg:grid-cols-[90px_1fr_110px_150px_48px]">
                <span className="mono-label">Tipo</span><span className="mono-label">Arquivo</span><span className="mono-label text-right">Registros</span><span className="mono-label text-right">Data / hora</span><span className="mono-label text-right"> </span>
              </div>
              <div className="divide-y divide-line">
                {importacoes.map((i) => {
                  const xml = i.tipo === "xml";
                  return (
                    <div key={i.id} className="grid gap-1 px-4 py-3.5 lg:grid-cols-[90px_1fr_110px_150px_48px] lg:items-center lg:gap-3">
                      <span><span className={`inline-block rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${xml ? "bg-accent/10 text-accent-deep" : "bg-slate-100 text-slate-600"}`}>{xml ? "XML" : "Relatório"}</span></span>
                      <span className="truncate text-[13.5px] font-medium text-ink" title={i.arquivo || ""}>
                        {i.arquivo || "—"}
                        {!xml && i.deposito && <span className="ml-1.5 text-[11.5px] text-mute">CD {i.deposito}</span>}
                      </span>
                      <span className="text-[12.5px] text-mute lg:text-right">{xml ? `${i.registros ?? 0} itens` : `${i.atualizados ?? i.registros ?? 0} pedidos`}</span>
                      <span className="text-[12.5px] text-mute lg:text-right">{dataHora(i.criado_em)}</span>
                      <span className="lg:text-right">
                        <button onClick={() => excluirImportacao(i.id, i.arquivo)} title="Remover este registro" aria-label="Remover este registro"
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-line text-ink/40 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {clienteModal && (<ClienteModal cliente={clienteModal.cliente} ordemFoco={clienteModal.ordem} onClose={() => setClienteModal(null)} />)}
    </AdminShell>
  );
}
