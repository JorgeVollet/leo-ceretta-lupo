"use client";

import { useMemo, useState } from "react";
import { Produto } from "@/lib/data";
import ProdutoModal from "./ProdutoModal";

export default function ProdutosGrid({
  produtos,
  catalogoSlug,
  catalogoTitulo,
  segmento,
}: {
  produtos: Produto[];
  catalogoSlug: string;
  catalogoTitulo: string;
  segmento: string;
}) {
  const [busca, setBusca] = useState("");
  const [linha, setLinha] = useState("todas");
  const [selecionado, setSelecionado] = useState<Produto | null>(null);

  const linhas = useMemo(() => {
    const set = new Set(produtos.map((p) => p.linha).filter(Boolean));
    return ["todas", ...Array.from(set)];
  }, [produtos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const matchLinha = linha === "todas" || p.linha === linha;
      const matchBusca =
        !termo ||
        p.nome.toLowerCase().includes(termo) ||
        p.codigo.toLowerCase().includes(termo);
      return matchLinha && matchBusca;
    });
  }, [produtos, busca, linha]);

  if (!produtos.length) return null;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink">Produtos desta coleção</h2>
          <p className="mt-1 text-[13px] text-mute">
            {filtrados.length} de {produtos.length} produtos — toque num item pra escolher tamanho, cor e quantidade.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="rounded border border-line bg-white px-3 py-2.5 text-[13px] text-ink placeholder:text-mute/70 focus:border-accent focus:outline-none"
          />
          {linhas.length > 2 && (
            <select
              value={linha}
              onChange={(e) => setLinha(e.target.value)}
              className="rounded border border-line bg-white px-3 py-2.5 text-[13px] text-ink focus:border-accent focus:outline-none"
            >
              {linhas.map((l) => (
                <option key={l} value={l}>
                  {l === "todas" ? "Todas as linhas" : l}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-lg border border-line bg-white py-10 text-center text-[13px] text-mute">
          Nenhum produto encontrado pra essa busca.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtrados.map((p) => (
            <button
              key={p.codigo}
              type="button"
              onClick={() => setSelecionado(p)}
              className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white text-left shadow-card transition duration-300 hover:border-accent hover:shadow-lift active:scale-[0.98]"
            >
              <div className="aspect-square overflow-hidden bg-bone">
                {p.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.img}
                    alt={p.nome}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3.5">
                <span className="mono-label text-[10px] text-accent-deep">{p.codigo}</span>
                <h3 className="font-display text-[13.5px] font-bold leading-snug text-ink">{p.nome}</h3>
                {p.linha && (
                  <span className="mono-label w-fit rounded bg-bone px-1.5 py-0.5 text-[9px] text-mute">{p.linha}</span>
                )}
                {p.cores?.length > 0 && (
                  <p className="mt-auto text-[11px] text-mute">{p.cores.map((c) => c.nome).join(" · ")}</p>
                )}
                <span className="mono-label mt-2 rounded bg-ink px-2.5 py-2 text-center text-[10.5px] text-paper transition group-hover:bg-accent">
                  Escolher tamanho e cor
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selecionado && (
        <ProdutoModal
          produto={selecionado}
          catalogoSlug={catalogoSlug}
          catalogoTitulo={catalogoTitulo}
          segmento={segmento}
          onClose={() => setSelecionado(null)}
        />
      )}
    </div>
  );
}
