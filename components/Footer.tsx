import { CONTATO } from "@/lib/data";

const links = [
  { label: "Catálogos", href: "/catalogos" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Marcas", href: "/#marcas" },
  { label: "Serviços", href: "/#servicos" },
  { label: "Dúvidas", href: "/#faq" },
];

export default function Footer() {
  return (
    <footer className="concreto sec-divider relative bg-stone px-5 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div className="leading-none">
            <div className="font-display text-[17px] font-extrabold uppercase tracking-tight text-ink">Leonardo Ceretta</div>
            <div className="mono-label mt-1 text-accent-deep">Representante Lupo</div>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="mono-label text-ink/70 transition hover:text-accent-deep">{l.label}</a>
            ))}
          </nav>
          <div className="flex flex-wrap justify-center gap-2.5">
            <a href={`https://wa.me/${CONTATO.whatsapp}`} target="_blank" rel="noopener" className="mono-label rounded border border-line bg-white px-3.5 py-2 text-ink transition hover:border-accent">WhatsApp</a>
            <a href={CONTATO.instagramUrl} target="_blank" rel="noopener" className="mono-label rounded border border-line bg-white px-3.5 py-2 text-ink transition hover:border-accent">Instagram</a>
            <a href={`mailto:${CONTATO.email}`} className="mono-label rounded border border-line bg-white px-3.5 py-2 text-ink transition hover:border-accent">E-mail</a>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-1 border-t border-stone-line/40 pt-6 text-center">
          <div className="text-[12px] text-ink/70">Catálogos atualizados toda semana · Pedidos pelo WhatsApp</div>
          <div className="mono-label text-ink/45">© {new Date().getFullYear()} Leonardo Ceretta · Site por JV Web Studio</div>
        </div>
      </div>

      {/* acesso discreto ao painel administrativo */}
      <a
        href="/admin/faturamento"
        aria-label="Painel administrativo"
        title="Painel"
        className="absolute bottom-3 right-3 text-ink/20 transition hover:rotate-45 hover:text-accent-deep"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </a>
    </footer>
  );
}
