"use client";
import { useState } from "react";
import { Catalogo } from "@/lib/data";
import CatalogoCard from "./CatalogoCard";

export default function CatalogosBrowser({ catalogos }: { catalogos: Catalogo[] }) {
  const segmentos = ["Todos", ...Array.from(new Set(catalogos.map((c) => c.segmento)))];
  const [filtro, setFiltro] = useState("Todos");

  const visiveis = filtro === "Todos" ? catalogos : catalogos.filter((c) => c.segmento === filtro);
  const grupos = Array.from(new Set(visiveis.map((c) => c.segmento)));

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-white/5 bg-navy-950/85 backdrop-blur-lg">
        <div className="no-scrollbar mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 py-3.5">
          {segmentos.map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition ${
                filtro === s
                  ? "border-accent bg-accent text-white shadow-[0_4px_14px_rgba(59,130,246,0.4)]"
                  : "border-white/10 bg-white/[0.03] text-cloud/70 hover:border-white/25 hover:text-cloud"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 pb-4 pt-2">
        {grupos.map((seg) => (
          <section key={seg} className="mt-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-5 w-1 rounded-full bg-accent" />
              <h2 className="font-display text-xl font-bold text-cloud">{seg}</h2>
              <span className="text-[12px] text-cloud/40">
                {visiveis.filter((c) => c.segmento === seg).length} catálogo(s)
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {visiveis
                .filter((c) => c.segmento === seg)
                .map((c) => (
                  <CatalogoCard key={c.slug} c={c} />
                ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
