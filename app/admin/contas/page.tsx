"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabaseBrowser } from "@/lib/supabase";
import { mascaraTelefone } from "@/lib/documentos";

type Conta = {
  id: string; razao_social: string | null; doc: string | null; email: string | null;
  criado_em: string; status: string; revisado_em?: string | null;
  origem_cadastro?: string | null; na_base?: boolean;
  // cadastro novo (formulário) — contas antigas vêm com null
  nome_contato?: string | null; cargo?: string | null; telefone?: string | null;
  pedidos_encontrados?: number | null; nome_nos_pedidos?: string | null;
};

const dataHora = (v: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const cnpjFmt = (v: string | null) => {
  if (!v) return null;
  const d = v.toUpperCase().replace(/[^0-9A-Z]/g, "");   // CNPJ novo pode ter letra
  if (d.length !== 14) return v;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
};
const CORES: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  aprovado: "bg-emerald-100 text-emerald-800",
  bloqueado: "bg-red-100 text-red-700",
};

export default function AdminContas() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!supabaseBrowser) return setCarregando(false);
    setCarregando(true); setErro("");
    const { data, error } = await supabaseBrowser.rpc("todas_contas");
    if (error) setErro(error.message.includes("does not exist") || error.message.includes("schema cache")
      ? "Falta rodar o SUPABASE-review-contas.sql no Supabase."
      : error.message);
    setContas((data as Conta[]) || []);
    setCarregando(false);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function revisar(id: string, acao: "aprovar" | "bloquear" | "pendente") {
    if (!supabaseBrowser) return;
    if (acao === "bloquear" && !confirm("Bloquear esta conta? O cliente perde o acesso ao catálogo na hora.")) return;
    setBusy(id);
    const { error } = await supabaseBrowser.rpc("revisar_conta", { p_id: id, p_acao: acao });
    setBusy(null);
    if (error) { alert("Não consegui atualizar: " + error.message); return; }
    setContas((p) => p.map((c) => c.id === id ? { ...c, status: acao === "aprovar" ? "aprovado" : acao === "bloquear" ? "bloqueado" : "pendente", revisado_em: new Date().toISOString() } : c));
  }

  // sem fila de aprovação: conta nova já entra liberada. Aqui é só consulta + bloqueio.
  const lista = contas;

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink">Contas de clientes</h1>
        <p className="mt-1 text-[14px] text-mute">Quem criou conta no site. A conta já entra liberada — se não reconhecer alguém, é só bloquear.</p>
      </div>

      {erro && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-5">
          <p className="font-display text-[15px] font-extrabold text-amber-900">Atenção</p>
          <p className="mt-1.5 text-[13.5px] text-amber-800">{erro}</p>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <span className="mono-label text-ink/60">{contas.length} conta{contas.length === 1 ? "" : "s"}</span>
        <button onClick={carregar} className="mono-label rounded border border-line bg-white px-4 py-2.5 text-ink/55 transition hover:text-ink">Atualizar</button>
      </div>

      {carregando ? (
        <p className="text-[14px] text-mute">Carregando...</p>
      ) : lista.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-10 text-center shadow-card">
          <p className="font-display text-[15px] font-extrabold text-ink">Nenhuma conta ainda</p>
          <p className="mt-1 text-[13px] text-mute">Assim que alguém criar conta no site, aparece aqui.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {lista.map((c) => (
            <div key={c.id} className={`rounded-lg border bg-white p-4 shadow-card ${c.status === "bloqueado" ? "border-red-200" : "border-line"}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-[15px] font-extrabold tracking-tight text-ink">{c.razao_social || "—"}</span>
                {c.status === "bloqueado" && (
                  <span className={`inline-block rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${CORES.bloqueado}`}>bloqueado</span>
                )}
                {c.na_base === false && <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-violet-700" title="Não encontrado nos relatórios">fora da base</span>}
                <span className="ml-auto text-[12px] text-mute">{dataHora(c.criado_em)}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-mute">
                {c.nome_contato && <span className="font-semibold text-ink/80">{c.nome_contato}{c.cargo ? ` · ${c.cargo}` : ""}</span>}
                {c.email && <span>{c.email}</span>}
                {c.telefone && (
                  <a href={`https://wa.me/55${c.telefone}`} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-ink">
                    {mascaraTelefone(c.telefone)}
                  </a>
                )}
                {c.doc && <span>CNPJ {cnpjFmt(c.doc)}</span>}
                {c.revisado_em && <span>revisado em {dataHora(c.revisado_em)}</span>}
              </div>
              {/* quantos pedidos da Lupo essa conta enxerga em "Meus pedidos" */}
              {c.pedidos_encontrados != null && (
                <p className={`mt-2 text-[12.5px] ${c.pedidos_encontrados > 0 ? "text-ink/75" : "text-mute"}`}>
                  {c.pedidos_encontrados > 0
                    ? <>Casa com <b>{c.pedidos_encontrados}</b> pedido{c.pedidos_encontrados > 1 ? "s" : ""} do relatório da Lupo, que vêm como <b>{c.nome_nos_pedidos}</b></>
                    : "Nenhum pedido da Lupo casa com esse cadastro ainda"}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {c.status !== "bloqueado" && (
                  <button disabled={busy === c.id} onClick={() => revisar(c.id, "bloquear")} className="mono-label rounded border border-red-300 bg-white px-4 py-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                    Bloquear
                  </button>
                )}
                {c.status === "bloqueado" && (
                  <button disabled={busy === c.id} onClick={() => revisar(c.id, "aprovar")} className="mono-label rounded border border-line bg-white px-4 py-2 text-ink/70 transition hover:text-ink disabled:opacity-50">
                    Desbloquear
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
