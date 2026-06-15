import Link from "next/link";
import { Logo } from "./Logo";
import { CONTATO } from "@/lib/data";

export default function Header({ compact = false }: { compact?: boolean }) {
  return (
    <header className="relative overflow-hidden bg-navy-950 bg-navy-radial">
      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-5">
        <Link href="/" aria-label="Início">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${CONTATO.whatsapp}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-medium text-cloud transition hover:border-accent/60 hover:bg-white/10"
          >
            WhatsApp
          </a>
        </div>
      </div>

      {!compact && (
        <div className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-bright">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-bright" />
            Catálogos 2026 / 2027
          </span>
          <h1 className="mt-5 max-w-[18ch] font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-cloud md:text-6xl">
            Toda a linha Lupo, <span className="text-gradient">num só lugar.</span>
          </h1>
          <div className="mt-5 max-w-[62ch] space-y-3 text-[15px] leading-relaxed text-cloud/65 md:text-[16.5px]">
            <p>
              📖 Explore os catálogos por segmento, escolha as linhas mais adequadas para
              o seu negócio e faça o download dos materiais de apoio.
            </p>
            <p>
              📲 Agende seu atendimento presencial ou pelo WhatsApp e garanta condições
              especiais, melhor planejamento de compras e maior segurança na entrega dos
              produtos.
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
    </header>
  );
}
