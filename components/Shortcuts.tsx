import { CONTATO } from "@/lib/data";

const Icon = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const items = [
  {
    t: "Rastrear entrega",
    d: "Acompanhe pela Braspress",
    href: CONTATO.rastreio,
    icon: "M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  },
  {
    t: "Portal de boletos",
    d: "Acesse seus boletos (Lupo)",
    href: CONTATO.boletos,
    icon: "M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6",
  },
  {
    t: "Falar comigo",
    d: "Dúvidas e pedidos",
    href: `https://wa.me/${CONTATO.whatsapp}`,
    icon: "M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 20l1.5-5A8.5 8.5 0 1 1 21 11.5z",
  },
];

export default function Shortcuts() {
  return (
    <section className="mx-auto mt-10 max-w-6xl px-5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {items.map((it) => (
          <a
            key={it.t}
            href={it.href}
            target="_blank"
            rel="noopener"
            className="group flex items-center gap-3.5 rounded-2xl border border-white/8 bg-navy-800/50 p-4 transition hover:-translate-y-0.5 hover:border-accent/40"
          >
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-accent/12 text-accent-bright transition group-hover:bg-accent/20">
              <Icon d={it.icon} />
            </div>
            <div>
              <div className="text-[14.5px] font-semibold text-cloud">{it.t}</div>
              <div className="text-xs text-cloud/45">{it.d}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
