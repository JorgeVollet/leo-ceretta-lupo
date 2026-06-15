import Link from "next/link";
import { Catalogo, linkPedido } from "@/lib/data";

export default function CatalogoCard({ c }: { c: Catalogo }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-navy-800/60 shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow">
      <Link href={`/catalogo/${c.slug}`} className="relative block">
        <div
          className="relative aspect-[4/3] overflow-hidden bg-navy-900 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
          style={{ backgroundImage: c.capa ? `url('${c.capa}')` : undefined }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
          <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-navy-950/70 px-2.5 py-1 text-[10.5px] font-semibold text-cloud backdrop-blur">
            {c.segmento}
          </span>
          {c.navegavel && (
            <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10.5px] font-bold text-white shadow-[0_4px_14px_rgba(59,130,246,0.5)]">
              Ver produtos
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold text-cloud">{c.titulo}</h3>
        <p className="mb-4 mt-1 flex-1 text-[13px] leading-relaxed text-cloud/50">{c.descricao}</p>
        <div className="flex gap-2">
          <Link
            href={`/catalogo/${c.slug}`}
            className="flex-1 rounded-xl bg-accent px-3 py-2.5 text-center text-[13.5px] font-semibold text-white transition hover:bg-accent-bright active:scale-[0.98]"
          >
            Abrir
          </Link>
          <a
            href={linkPedido(c.titulo, c.segmento)}
            target="_blank"
            rel="noopener"
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-center text-[13.5px] font-semibold text-cloud transition hover:border-accent/50 hover:bg-white/10 active:scale-[0.98]"
          >
            Pedir
          </a>
        </div>
      </div>
    </article>
  );
}
