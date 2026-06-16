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
      <div className="mx-auto mt-8 max-w-6xl px-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {segmentos.map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`mono-label whitespace-nowrap rounded px-4 py-2.5 transition ${
                filtro === s
                  ? "bg-ink text-paper"
                  : "glass text-ink/75 hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-4">
        {grupos.map((seg) => (
          <div key={seg} className="mt-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="mono-label text-accent-deep">›</span>
              <h3 className="font-display text-[18px] font-extrabold tracking-tight text-ink">{seg}</h3>
              <span className="mono-label text-ink/55">
                {visiveis.filter((c) => c.segmento === seg).length} catálogo(s)
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {visiveis
                .filter((c) => c.segmento === seg)
                .map((c) => (
                  <CatalogoCard key={c.slug} c={c} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
