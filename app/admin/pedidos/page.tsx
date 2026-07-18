"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabaseBrowser } from "@/lib/supabase";

type ItemPedido = {
  codigo: string;
  nome: string;
  tamanho: string;
  cor: string;
  quantidade: number;
  catalogoTitulo?: string;
};

type Pedido = {
  id: number;
  criado_em: string;
  status: string;
  cliente_nome: string;
  cliente_loja: string | null;
  cliente_whatsapp: string;
  cliente_email: string | null;
  cliente_cidade: string | null;
  catalogo_slug: string;
  itens: ItemPedido[];
  total_pecas: number;
  observacoes: string | null;
};

const STATUS_OPCOES = ["novo", "em_andamento", "concluido"];
const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

function formatarData(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!supabaseBrowser) {
      setErro("Supabase não configurado.");
      setCarregando(false);
      return;
    }
    const { data, error } = await supabaseBrowser
      .from("pedidos")
      .select("*")
      .order("criado_em", { ascending: false });
    if (error) {
      setErro(
        "Não consegui carregar os pedidos. Confira se rodou o SUPABASE-pedidos.sql e se a policy " +
          "de leitura pra usuário logado (authenticated) foi criada."
      );
    } else {
      setPedidos((data as Pedido[]) || []);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function mudarStatus(id: number, status: string) {
    setPedidos((atual) => atual.map((p) => (p.id === id ? { ...p, status } : p)));
    if (!supabaseBrowser) return;
    await supabaseBrowser.from("pedidos").update({ status }).eq("id", id);
  }

  return (
    <AdminShell>
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink">Pedidos</h1>
          <p className="mt-1 text-[14px] text-mute">
            Pedidos enviados pelo carrinho do site, com tamanho, cor e quantidade escolhidos.
          </p>
        </div>
        <button
          onClick={carregar}
          className="mono-label rounded border border-line px-3.5 py-2.5 text-ink/60 transition hover:text-ink"
        >
          Atualizar
        </button>
      </div>

      {erro && (
        <p className="mb-5 rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{erro}</p>
      )}

      {carregando ? (
        <p className="text-[14px] text-mute">Carregando...</p>
      ) : pedidos.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center shadow-card">
          <p className="font-display text-[15px] font-extrabold text-ink">Nenhum pedido ainda</p>
          <p className="mt-1 text-[13px] text-mute">Assim que alguém fechar um pedido pelo site, ele aparece aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((p) => (
            <div key={p.id} className="rounded-lg border border-line bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                <div>
                  <div className="font-display text-[15px] font-extrabold tracking-tight text-ink">
                    {p.cliente_nome} {p.cliente_loja && <span className="text-mute">— {p.cliente_loja}</span>}
                  </div>
                  <div className="mt-1 text-[12.5px] text-mute">
                    {formatarData(p.criado_em)} · {p.total_pecas} peças · {p.catalogo_slug}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-[12.5px] text-mute">
                    <span>WhatsApp: {p.cliente_whatsapp}</span>
                    {p.cliente_email && <span>E-mail: {p.cliente_email}</span>}
                    {p.cliente_cidade && <span>Cidade: {p.cliente_cidade}</span>}
                  </div>
                </div>
                <select
                  value={p.status}
                  onChange={(e) => mudarStatus(p.id, e.target.value)}
                  className="mono-label rounded border border-line bg-white px-3 py-2 text-[12px] text-ink"
                >
                  {STATUS_OPCOES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s] ?? s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 divide-y divide-line">
                {p.itens.map((it, idx) => (
                  <div key={idx} className="flex flex-wrap items-center justify-between gap-1 py-2 text-[13px]">
                    <span className="text-ink">
                      {it.nome} <span className="text-mute">(cód. {it.codigo})</span>
                    </span>
                    <span className="text-mute">
                      Tam. {it.tamanho} · Cor {it.cor} · {it.quantidade}x
                    </span>
                  </div>
                ))}
              </div>
              {p.observacoes && (
                <p className="mt-3 rounded bg-bone px-3 py-2 text-[12.5px] text-mute">Obs: {p.observacoes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
