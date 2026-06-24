import { CONTATO } from "@/lib/data";
import HeroVideo from "./HeroVideo";
import Nav from "./Nav";
import AcessoRapido from "./AcessoRapido";

export default function Header({ compact = false }: { compact?: boolean }) {
  /* ---------- PÁGINAS INTERNAS (compact): nav clara, sem vídeo ---------- */
  if (compact) {
    return (
      <header className="bg-paper">
        <Nav variant="solid" />
        {/* espaçador pra compensar a nav fixa */}
        <div className="h-[60px]" />
      </header>
    );
  }

  /* ---------- HOME: HERO FULL-BLEED EM VÍDEO ---------- */
  return (
    <header className="relative isolate min-h-[88svh] overflow-hidden bg-ink text-paper md:min-h-screen">
      {/* VÍDEO DE FUNDO (full-bleed, com parallax) */}
      <HeroVideo />

      {/* CAMADAS DE LEGIBILIDADE */}
      <div className="absolute inset-0 -z-10 bg-ink/45" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(8,11,16,0.92)_0%,rgba(8,11,16,0.72)_34%,rgba(8,11,16,0.30)_62%,rgba(8,11,16,0.05)_100%)]" />
      <div className="grain absolute inset-0 -z-10 opacity-[0.06]" />

      {/* NAV (hide on scroll down / show on scroll up) */}
      <Nav variant="hero" />

      {/* CONTEÚDO DO HERO */}
      <div className="relative z-10 mx-auto flex min-h-[calc(88svh-64px)] max-w-6xl flex-col justify-center px-5 pt-24 pb-16 md:min-h-[calc(100vh-68px)] md:py-20">
        {/* MOBILE: botão de acesso rápido no lugar do status */}
        <div className="reveal mb-9 border-b border-white/15 pb-6 md:hidden">
          <AcessoRapido variant="dark" />
        </div>

        {/* DESKTOP: status line (mantida) */}
        <div className="reveal mb-9 hidden flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/15 pb-6 md:flex">
          <span className="mono-label flex items-center gap-2 text-paper/90">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Status: Atendendo
          </span>
          <span className="mono-label text-paper/60">Representante Oficial Lupo</span>
          <span className="mono-label ml-auto text-accent-sky">Coleção 26 / 27</span>
        </div>

        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            {/* bloco de dados */}
            <div className="reveal mb-7 space-y-1">
              <div className="mono-label text-accent-sky">Representante Oficial Lupo</div>
              <div className="mono-label text-paper/60">Setor: Moda Íntima · Meias · Praia · Esporte</div>
              <div className="mono-label text-paper/60">Região: Noroeste do RS</div>
            </div>

            <h1 className="headline text-paper [text-shadow:0_2px_30px_rgba(0,0,0,0.35)]" style={{ fontSize: "clamp(2.8rem, 9vw, 6.5rem)" }}>
              <span className="hero-line" style={{ animationDelay: "0.05s" }}>TODA A LINHA</span><br />
              <span className="hero-line text-paper/55" style={{ animationDelay: "0.18s" }}>LUPO</span><br />
              <span className="hero-line text-accent-sky" style={{ animationDelay: "0.31s" }}>EM UM SÓ LUGAR.</span>
            </h1>
          </div>

          <p className="reveal max-w-[42ch] border-l-2 border-accent-sky pl-5 text-[15px] leading-relaxed text-paper/85 md:text-[16px]" style={{ fontFamily: "Georgia, serif" }}>
            Sou Leonardo, representante oficial da Lupo no Noroeste do RS. Explore os
            catálogos, encontre as linhas ideais para o seu negócio e conte com um
            atendimento personalizado e profissional. Garanta as melhores condições
            comerciais, suporte dedicado e a segurança de trabalhar com quem conhece o
            mercado da sua região.
          </p>
        </div>

        <div className="reveal mt-10 flex flex-wrap gap-3">
          <a
            href="/catalogos"
            className="shimmer group inline-flex items-center gap-2 rounded bg-accent px-7 py-4 font-display text-[15px] font-bold uppercase tracking-wide text-paper transition hover:bg-accent-bright"
          >
            Ver catálogos
            <span className="transition group-hover:translate-x-1">→</span>
          </a>
          <a
            href={`https://wa.me/${CONTATO.whatsapp}`}
            target="_blank"
            rel="noopener"
            className="glass-dark inline-flex items-center gap-2 rounded px-7 py-4 font-display text-[15px] font-bold uppercase tracking-wide text-paper transition"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
