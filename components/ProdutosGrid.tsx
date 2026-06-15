"use client";
import { useState, useMemo } from "react";
import { Produto, linkPedidoProduto } from "@/lib/data";

export default function ProdutosGrid({ produtos }: { produtos: Produto[] }) {
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<Produto | null>(null);

  const lista = useMemo(() => {
    const t = busca.toLowerCase().trim();
    if (!t) return produtos;
    return produtos.filter(
      (p) => p.nome.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t)
    );
  }, [busca, produtos]);

  return (
    <>
      <div className="mb-5">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou código do produto…"
          className="w-full rounded-xl border border-white/10 bg-navy-800/60 px-4 py-3 text-[14px] text-cloud placeholder:text-cloud/35 outline-none transition focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {lista.map((p) => (
          <button
            key={p.codigo}
            onClick={() => setSel(p)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-navy-800/50 text-left transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-white">
              {p.img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.img} alt={p.nome} className="h-full w-full object-contain transition group-hover:scale-[1.04]" />
              )}
              {p.linha && (
                <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[9.5px] font-bold uppercase text-white">
                  {p.linha}
                </span>
              )}
            </div>
            <div className="p-3">
              <div className="font-mono text-[11px] text-accent-bright/70">{p.codigo}</div>
              <div className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-cloud">{p.nome}</div>
              {p.cores.length > 0 && (
                <div className="mt-1.5 text-[11.5px] text-cloud/45">
                  {p.cores.length} {p.cores.length === 1 ? "cor" : "cores"}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {lista.length === 0 && (
        <div className="py-16 text-center text-cloud/40">Nenhum produto encontrado para “{busca}”.</div>
      )}

      {sel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/85 p-4 backdrop-blur-sm"
          onClick={() => setSel(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-white/10 bg-navy-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/8 p-4">
              <div>
                <div className="font-mono text-[11px] text-accent-bright/70">{sel.codigo}</div>
                <h3 className="font-display text-lg font-bold text-cloud">{sel.nome}</h3>
              </div>
              <button onClick={() => setSel(null)} className="text-2xl leading-none text-cloud/50 hover:text-cloud">
                &times;
              </button>
            </div>
            {sel.img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sel.img} alt={sel.nome} className="w-full bg-white object-contain" />
            )}
            <div className="space-y-3 p-4">
              {sel.descricao && <p className="text-[13.5px] leading-relaxed text-cloud/60">{sel.descricao}</p>}
              {sel.cores.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-cloud/40">Cores</div>
                  <div className="flex flex-wrap gap-2">
                    {sel.cores.map((c) => (
                      <span key={c.cod} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12.5px] text-cloud">
                        {c.nome} <span className="text-cloud/40">{c.cod}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sel.tamanho && (
                <div>
                  <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-cloud/40">Tamanhos</div>
                  <div className="text-[13.5px] text-cloud/80">{sel.tamanho}</div>
                </div>
              )}
              <a
                href={linkPedidoProduto(sel.codigo, sel.nome)}
                target="_blank"
                rel="noopener"
                className="mt-2 block rounded-xl bg-accent py-3 text-center text-[14.5px] font-semibold text-white transition hover:bg-accent-bright"
              >
                Pedir este produto pelo WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
