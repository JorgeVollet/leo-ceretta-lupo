import Link from "next/link";
import { Catalogo, linkPedido } from "@/lib/data";
import TiltCard from "./TiltCard";

export default function CatalogoCard({ c }: { c: Catalogo }) {
  return (
    <TiltCard className="h-full">
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card transition duration-300 hover:border-accent hover:shadow-lift">
      <Link href={`/catalogo/${c.slug}`} className="relative block overflow-hidden bg-bone">
        <div
          className="aspect-[4/3] bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
          style={{ backgroundImage: c.capa ? `url('${c.capa}')` : undefined }}
        />
        <span className="mono-label absolute left-3 top-3 rounded bg-ink/85 px-2.5 py-1 text-paper backdrop-blur">
          {c.segmento}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[18px] font-extrabold tracking-tight text-ink">{c.titulo}</h3>
        <p className="mb-4 mt-1 flex-1 text-[13px] leading-relaxed text-mute">{c.descricao}</p>
        <div className="flex gap-2">
          <Link href={`/catalogo/${c.slug}`} className="mono-label flex-1 rounded bg-ink px-3 py-2.5 text-center text-paper transition hover:bg-accent active:scale-[0.98]">
            Abrir
          </Link>
          <a href={linkPedido(c.titulo, c.segmento)} target="_blank" rel="noopener" className="mono-label flex-1 rounded border border-line bg-white px-3 py-2.5 text-center text-ink transition hover:border-accent active:scale-[0.98]">
            Pedir
          </a>
        </div>
      </div>
    </article>
    </TiltCard>
  );
}
