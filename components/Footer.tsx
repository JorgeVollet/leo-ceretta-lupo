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
    <footer className="concreto sec-divider bg-stone px-5 py-12">
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
    </footer>
  );
}
