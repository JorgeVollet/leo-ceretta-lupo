"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabaseBrowser } from "@/lib/supabase";
import { useCliente } from "@/lib/cliente-auth";
import { STATUS_LABEL, STATUS_COR } from "@/lib/parsers";

type Ped = {
  ordem_venda: string; status: string; nota_fiscal: string | null;
  valor_ov: number | null; valor_fatura: number | null;
  data_criacao: string | null; data_emissao: string | null; data_expedicao: string | null;
  reanotacao: boolean | null; deposito: string | null;
};

// pedido feito pelo carrinho do site (tabela pedidos)
type PedSite = {
  id: number; criado_em: string; status: string; total_pecas: number;
  itens: { nome?: string; codigo?: string; quantidade?: number }[] | null;
};
const SITE_LABEL: Record<string, string> = { novo: "Recebido", em_andamento: "Em andamento", concluido: "Concluído" };
const SITE_COR: Record<string, string> = {
  novo: "bg-sky-100 text-sky-800", em_andamento: "bg-amber-100 text-amber-800", concluido: "bg-emerald-100 text-emerald-800",
};

const brl = (v: number | null | undefined) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (v: string | null) => { if (!v) return "—"; const d = v.slice(0, 10); const [a, m, dia] = d.split("-"); return dia ? `${dia}/${m}/${a}` : v; };

export default function MeusPedidos() {
  const router = useRouter();
  const { cliente, carregando, sair } = useCliente();
  const [pedidos, setPedidos] = useState<Ped[]>([]);
  const [doSite, setDoSite] = useState<PedSite[]>([]);
  const [busy, setBusy] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "aberto" | "despachado">("todos");

  useEffect(() => {
    if (carregando) return;
    if (!cliente) { router.push("/entrar?redirect=/meus-pedidos"); return; }
    (async () => {
      if (!supabaseBrowser) { setBusy(false); return; }
      setBusy(true);
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      const [lupo, site] = await Promise.all([
        supabaseBrowser.rpc("meus_pedidos"),
        // só os do próprio login (o filtro importa pro admin, que lê todos pela RLS)
        user
          ? supabaseBrowser.from("pedidos").select("id,criado_em,status,total_pecas,itens")
              .eq("auth_user_id", user.id).order("criado_em", { ascending: false }).limit(50)
          : Promise.resolve({ data: [] as PedSite[] }),
      ]);
      setPedidos((lupo.data as Ped[]) || []);
      setDoSite((site.data as PedSite[]) || []);
      setBusy(false);
    })();
  }, [cliente, carregando, router]);

  const abertos = useMemo(() => pedidos.filter((p) => p.status !== "despachado" && p.status !== "cancelado").length, [pedidos]);
  const despachados = useMemo(() => pedidos.filter((p) => p.status === "despachado").length, [pedidos]);
  const filtrados = useMemo(() => pedidos.filter((p) =>
    filtro === "todos" ? true : filtro === "despachado" ? p.status === "despachado" : (p.status !== "despachado" && p.status !== "cancelado")
  ), [pedidos, filtro]);

  const chip = (k: typeof filtro, label: string, n: number) => (
    <button onClick={() => setFiltro(k)} className={`mono-label rounded-full px-4 py-2 transition ${filtro === k ? "bg-ink text-paper" : "border border-line bg-white text-ink/60 hover:text-ink"}`}>
      {label} <span className="opacity-60">{n}</span>
    </button>
  );

  return (
    <>
      <Header compact />
      <main className="bg-paper">
        <div className="mx-auto max-w-3xl px-5 py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="mono-label text-accent-deep">Área do cliente</span>
              <h1 className="headline mt-1 text-ink" style={{ fontSize: "clamp(1.9rem,5vw,2.6rem)" }}>Meus pedidos</h1>
              {cliente?.razao_social && <p className="mt-1 text-[13.5px] text-mute">{cliente.razao_social}</p>}
            </div>
            <button onClick={() => { sair(); router.push("/"); }} className="mono-label rounded border border-line px-3.5 py-2 text-ink/55 transition hover:text-ink">Sair</button>
          </div>

          {/* pedidos feitos pelo carrinho do site */}
          {!carregando && !busy && doSite.length > 0 && (
            <section className="mt-6">
              <h2 className="mono-label text-ink/60">Pedidos feitos pelo site</h2>
              <div className="mt-2.5 space-y-2.5">
                {doSite.map((p) => {
                  const itens = Array.isArray(p.itens) ? p.itens : [];
                  const resumo = itens.slice(0, 3).map((i) => i.nome || i.codigo).filter(Boolean).join(" · ");
                  return (
                    <div key={p.id} className="rounded-lg border border-line bg-white p-4 shadow-card">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-display text-[14px] font-extrabold text-ink">Pedido {p.id}</span>
                        <span className={`inline-block rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${SITE_COR[p.status] || "bg-slate-100 text-slate-700"}`}>
                          {SITE_LABEL[p.status] || p.status}
                        </span>
                        <span className="ml-auto text-[13px] font-semibold text-ink">{p.total_pecas} peça{p.total_pecas === 1 ? "" : "s"}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-mute">
                        <span>Enviado: <b className="text-ink/80">{dataBR(p.criado_em)}</b></span>
                        {resumo && <span className="truncate">{resumo}{itens.length > 3 ? ` +${itens.length - 3}` : ""}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <h2 className="mono-label mt-8 -mb-3 text-ink/60">Pedidos na Lupo</h2>
            </section>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {chip("todos", "Todos", pedidos.length)}
            {chip("aberto", "Em aberto", abertos)}
            {chip("despachado", "Despachados", despachados)}
          </div>

          {carregando || busy ? (
            <p className="mt-8 text-[14px] text-mute">Carregando seus pedidos...</p>
          ) : pedidos.length === 0 ? (
            <div className="mt-8 rounded-lg border border-line bg-white p-10 text-center shadow-card">
              <p className="font-display text-[15px] font-extrabold text-ink">Nenhum pedido encontrado ainda</p>
              <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-mute">
                {doSite.length > 0
                  ? "Os pedidos que você fez pelo site estão acima. Quando a Lupo registrar, eles aparecem aqui com nota fiscal e status de entrega."
                  : "Assim que seus pedidos entrarem no sistema da Lupo, eles aparecem aqui com o status de entrega."}
              </p>
              <Link href="/catalogos" className="mono-label mt-4 inline-block rounded bg-ink px-5 py-3 text-paper transition hover:bg-accent">Ver catálogos</Link>
            </div>
          ) : (
            <div className="mt-6 space-y-2.5">
              {filtrados.map((p) => {
                const billed = p.status === "faturado" || p.status === "despachado";
                return (
                  <div key={p.ordem_venda} className="rounded-lg border border-line bg-white p-4 shadow-card">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-display text-[14px] font-extrabold text-ink">#{p.ordem_venda}</span>
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${STATUS_COR[p.status] || "bg-slate-100 text-slate-700"}`}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                      {p.nota_fiscal && <span className="text-[12px] text-mute">NF {p.nota_fiscal}</span>}
                      <span className="ml-auto text-[14px] font-semibold text-ink">{brl(billed ? p.valor_fatura : p.valor_ov)}</span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-mute">
                      <span>Pedido: <b className="text-ink/80">{dataBR(p.data_criacao)}</b></span>
                      {p.status === "despachado" ? (
                        <span className="text-emerald-700">Despachado: <b>{dataBR(p.data_expedicao)}</b></span>
                      ) : (
                        <span>Previsão: <b className="text-ink/80">em preparação</b></span>
                      )}
                    </div>
                  </div>
                );
              })}
              {filtrados.length === 0 && <p className="rounded-lg border border-line bg-white p-6 text-center text-[13px] text-mute">Nenhum pedido nesse filtro.</p>}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
