import * as XLSX from "xlsx";

/* ============================================================
   PARSERS — Relatório dos CDs (XLS/XLSX) e XML de NF-e
   Chave de ligação: ORDEM DE VENDA
   ============================================================ */

/* ---------- helpers ---------- */

/** Remove zeros à esquerda: "0006355352" -> "6355352" */
export function normalizarOV(v: unknown): string {
  const s = String(v ?? "").trim().replace(/\D/g, "");
  return s.replace(/^0+/, "") || s;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  const s = String(v).trim().replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function texto(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s && s.toLowerCase() !== "nan" && s !== "NaT" ? s : null;
}

/** Aceita Date, serial do Excel e strings dd/mm/aaaa ou aaaa-mm-dd */
function data(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === "number" && v > 20000 && v < 60000) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  if (!s || s === "NaT" || s.toLowerCase() === "nan") return null;
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Converte o status do relatório no status que o cliente entende */
export function normalizarStatus(statusOrigem?: string | null, statusLegado?: string | null, dataExpedicao?: string | null) {
  const s = (statusOrigem || "").toLowerCase();
  const l = (statusLegado || "").toLowerCase();
  if (s.includes("cancel")) return "cancelado";
  if (s.includes("faturada")) {
    if (dataExpedicao || l.includes("despacho")) return "despachado";
    return "faturado";
  }
  if (s.includes("remessa") || l.includes("apartad")) return "separacao";
  if (s.includes("inclu")) return "recebido";
  return "recebido";
}

export const STATUS_LABEL: Record<string, string> = {
  recebido: "Pedido recebido",
  separacao: "Em separação",
  faturado: "Faturado",
  despachado: "Despachado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STATUS_COR: Record<string, string> = {
  recebido: "bg-slate-100 text-slate-700",
  separacao: "bg-amber-100 text-amber-800",
  faturado: "bg-blue-100 text-blue-800",
  despachado: "bg-emerald-100 text-emerald-800",
  entregue: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-700",
};

/* ---------- 1) RELATÓRIO DOS CDs ---------- */

export type PedidoImportado = {
  ordem_venda: string;
  cliente_nome: string | null;
  cliente_codigo: string | null;
  uf: string | null;
  deposito: string | null;
  tipo: string | null;
  valor_ov: number | null;
  valor_fatura: number | null;
  qtde_solicitada: number | null;
  qtde_atendida: number | null;
  status_origem: string | null;
  status: string;
  status_legado: string | null;
  status_credito: string | null;
  motivo_recusa: string | null;
  nota_fiscal: string | null;
  duplicata: string | null;
  remessa: string | null;
  data_criacao: string | null;
  data_desejada: string | null;
  data_emissao: string | null;
  data_expedicao: string | null;
  transportadora: string | null;
  volumes: number | null;
  cond_pagamento: string | null;
  tabela_preco: string | null;
  grupo_clientes: string | null;
  descricao: string | null;
  atualizado_em: string;
  snapshot_em: string | null;
  ped_cli: string | null;       // valor cru da coluna "Ped.Cli."
  reanotacao: boolean;          // true se este pedido é um saldo re-notado
  pedido_pai: string | null;    // OV do pedido de origem (quando vem "SAL<num>")
};

/** Lê a coluna "Ped.Cli." e diz se o pedido é uma reanotação (saldo re-notado)
 *  e qual o pedido de origem. Ex.: "N/A/SAL6161274" -> reanotação do pedido 6161274. */
export function analisaReanotacao(pedCli?: string | null): { reanotacao: boolean; pedido_pai: string | null } {
  const p = String(pedCli ?? "");
  const sal = p.match(/SAL\s*0*(\d+)/i);
  const reanot = !!sal || /reanota/i.test(p);
  return { reanotacao: reanot, pedido_pai: sal ? normalizarOV(sal[1]) : null };
}

/** Acha a coluna mesmo com variação de acento/espaço */
function pega(linha: Record<string, unknown>, ...nomes: string[]) {
  const chaves = Object.keys(linha);
  for (const nome of nomes) {
    const alvo = nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
    const achou = chaves.find(
      (k) => k.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "") === alvo
    );
    if (achou !== undefined) return linha[achou];
  }
  return undefined;
}

/** O CD verdadeiro vem no fim do nome do arquivo: PEDIDOS_..._1000.xls -> "1000".
 *  (A coluna "Depósito" dentro da planilha vem sempre como 0020 e não distingue os CDs.) */
export function cdDoNome(nome?: string | null): string | null {
  if (!nome) return null;
  const m = nome.match(/_(\d{3,6})\.xlsx?$/i);
  return m ? m[1] : null;
}

/** O horário do relatório vem no nome: PEDIDOS_20260718_141913_1000.xls -> 2026-07-18T14:19:13.
 *  Serve pra não deixar um relatório MAIS ANTIGO sobrescrever os dados de um mais novo. */
export function snapshotDoNome(nome?: string | null): string | null {
  if (!nome) return null;
  const m = nome.match(/_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : null;
}

/** Núcleo: transforma um workbook XLSX já lido em pedidos. Usado no navegador e no servidor.
 *  nomeArquivo é opcional e serve pra extrair o CD (depósito) do nome. */
export function pedidosDeWorkbook(buf: ArrayBuffer | Uint8Array | Buffer, nomeArquivo?: string | null): PedidoImportado[] {
  const wb = XLSX.read(buf as any, { cellDates: true, type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
  const cdArquivo = cdDoNome(nomeArquivo);
  const snapArquivo = snapshotDoNome(nomeArquivo);

  const out: PedidoImportado[] = [];
  for (const l of linhas) {
    const ov = normalizarOV(pega(l, "Ordem de Venda", "OrdemVenda", "Ordem"));
    if (!ov) continue;

    const statusOrigem = texto(pega(l, "Status"));
    const statusLegado = texto(pega(l, "Status no Legado", "StatusLegado"));
    const dataExp = data(pega(l, "Data Expedição", "Data Expedicao"));
    const pedCli = texto(pega(l, "Ped.Cli.", "Ped Cli", "PedCli", "Pedido Cliente"));
    const reanot = analisaReanotacao(pedCli);

    out.push({
      ordem_venda: ov,
      cliente_nome: texto(pega(l, "Nome do cliente", "Cliente")),
      cliente_codigo: texto(pega(l, "Emissor da Ordem", "Codigo Cliente")),
      uf: texto(pega(l, "UF")),
      deposito: cdArquivo || texto(pega(l, "Depósito", "Deposito")),
      tipo: texto(pega(l, "Tipo")),
      valor_ov: num(pega(l, "Valor OV")),
      valor_fatura: num(pega(l, "Valor Fatura")),
      qtde_solicitada: num(pega(l, "Qtde. Solicitada", "Qtde Solicitada")),
      qtde_atendida: num(pega(l, "Qtde. Atendida", "Qtde Atendida")),
      status_origem: statusOrigem,
      status: normalizarStatus(statusOrigem, statusLegado, dataExp),
      status_legado: statusLegado,
      status_credito: texto(pega(l, "Status Crédito", "Status Credito")),
      motivo_recusa: texto(pega(l, "Motivo Recusa")),
      nota_fiscal: texto(pega(l, "Nota Fiscal")),
      duplicata: texto(pega(l, "Duplicata")),
      remessa: texto(pega(l, "Remessa")),
      data_criacao: data(pega(l, "Data criação", "Data criacao")),
      data_desejada: data(pega(l, "Data desejada remessa")),
      data_emissao: data(pega(l, "Emissão", "Emissao")),
      data_expedicao: dataExp,
      transportadora: texto(pega(l, "Transportadora")),
      volumes: num(pega(l, "Volumes")),
      cond_pagamento: texto(pega(l, "Cond.Pagamento", "Cond Pagamento")),
      tabela_preco: texto(pega(l, "Tabela de Preço", "Tabela de Preco")),
      grupo_clientes: texto(pega(l, "Grupo de Clientes")),
      descricao: texto(pega(l, "Descrição", "Descricao")),
      atualizado_em: new Date().toISOString(),
      snapshot_em: snapArquivo,
      ped_cli: pedCli,
      reanotacao: reanot.reanotacao,
      pedido_pai: reanot.pedido_pai,
    });
  }
  return out;
}

export async function lerRelatorio(file: File): Promise<PedidoImportado[]> {
  const buf = await file.arrayBuffer();
  return pedidosDeWorkbook(buf, file.name);
}

/* ---------- 2) XML DA NF-e ---------- */

export type NotaImportada = {
  nota: {
    chave: string | null;
    numero: string | null;
    serie: string | null;
    ordem_venda: string | null;
    emissao: string | null;
    valor_total: number | null;
    emitente_nome: string | null;
    emitente_cnpj: string | null;
    dest_nome: string | null;
    dest_cnpj: string | null;
    dest_municipio: string | null;
    dest_uf: string | null;
    dest_fone: string | null;
    transportadora: string | null;
    transp_cnpj: string | null;
    volumes: number | null;
    peso_bruto: number | null;
    inf_cpl: string | null;
  };
  itens: Array<{
    item: number;
    codigo: string | null;
    ean: string | null;
    descricao: string | null;
    ncm: string | null;
    cfop: string | null;
    unidade: string | null;
    quantidade: number | null;
    valor_unit: number | null;
    valor_total: number | null;
  }>;
  duplicatas: Array<{ parcela: string | null; vencimento: string | null; valor: number | null }>;
};

/** Extrai a Ordem de Venda do campo infCpl: "... | Pedido: 0006355352| ..." */
export function ovDoInfCpl(infCpl?: string | null): string | null {
  if (!infCpl) return null;
  const m = infCpl.match(/Pedido:\s*([0-9]+)/i);
  return m ? normalizarOV(m[1]) : null;
}

function t(el: Element | null | undefined, tag: string): string | null {
  const n = el?.getElementsByTagName(tag)?.[0];
  const v = n?.textContent?.trim();
  return v || null;
}

export async function lerXmlNfe(file: File): Promise<NotaImportada> {
  const txt = await file.text();
  const doc = new DOMParser().parseFromString(txt, "application/xml");

  const infNFe = doc.getElementsByTagName("infNFe")[0];
  const ide = doc.getElementsByTagName("ide")[0];
  const emit = doc.getElementsByTagName("emit")[0];
  const dest = doc.getElementsByTagName("dest")[0];
  const transp = doc.getElementsByTagName("transp")[0];
  const total = doc.getElementsByTagName("ICMSTot")[0];
  const infAdic = doc.getElementsByTagName("infAdic")[0];

  const chaveAttr = infNFe?.getAttribute("Id") || "";
  const chave = chaveAttr.replace(/^NFe/i, "") || null;
  const infCpl = t(infAdic, "infCpl");

  const enderDest = dest?.getElementsByTagName("enderDest")[0];
  const vol = transp?.getElementsByTagName("vol")[0];

  const nota: NotaImportada["nota"] = {
    chave,
    numero: t(ide, "nNF"),
    serie: t(ide, "serie"),
    ordem_venda: ovDoInfCpl(infCpl),
    emissao: t(ide, "dhEmi") || t(ide, "dEmi"),
    valor_total: num(t(total, "vNF")),
    emitente_nome: t(emit, "xNome"),
    emitente_cnpj: t(emit, "CNPJ"),
    dest_nome: t(dest, "xNome"),
    dest_cnpj: t(dest, "CNPJ") || t(dest, "CPF"),
    dest_municipio: t(enderDest, "xMun"),
    dest_uf: t(enderDest, "UF"),
    dest_fone: t(enderDest, "fone"),
    transportadora: t(transp, "xNome"),
    transp_cnpj: t(transp, "CNPJ"),
    volumes: num(t(vol, "qVol")),
    peso_bruto: num(t(vol, "pesoB")),
    inf_cpl: infCpl,
  };

  const itens: NotaImportada["itens"] = [];
  const dets = Array.from(doc.getElementsByTagName("det"));
  dets.forEach((d, i) => {
    const prod = d.getElementsByTagName("prod")[0];
    if (!prod) return;
    itens.push({
      item: parseInt(d.getAttribute("nItem") || String(i + 1), 10),
      codigo: t(prod, "cProd"),
      ean: (t(prod, "cEAN") || "").replace(/^SEM GTIN$/i, "") || null,
      descricao: t(prod, "xProd"),
      ncm: t(prod, "NCM"),
      cfop: t(prod, "CFOP"),
      unidade: t(prod, "uCom"),
      quantidade: num(t(prod, "qCom")),
      valor_unit: num(t(prod, "vUnCom")),
      valor_total: num(t(prod, "vProd")),
    });
  });

  const duplicatas: NotaImportada["duplicatas"] = Array.from(doc.getElementsByTagName("dup")).map((d) => ({
    parcela: t(d, "nDup"),
    vencimento: data(t(d, "dVenc")),
    valor: num(t(d, "vDup")),
  }));

  return { nota, itens, duplicatas };
}
