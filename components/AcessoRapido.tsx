"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Menu "Acesso Rápido" — dropdown com 4 atalhos que rolam até a seção certa.
 * Pensado pro público do Leonardo: bem visível, itens grandes, ícones claros.
 * variant="dark" → sobre o vídeo do hero (mobile). variant="light" → nav clara.
 */

const atalhos = [
  {
    href: "/#materiais",
    label: "Materiais de divulgação",
    desc: "Fotos e artes pra postar",
    icon: "M4 5h16v11H4zM4 16l4-4 3 3 4-5 5 6",
  },
  {
    href: "/#rastreio",
    label: "Rastrear entrega",
    desc: "Acompanhe seu pedido",
    icon: "M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  },
  {
    href: "/#boletos",
    label: "Portal de boletos",
    desc: "Acesse seus boletos",
    icon: "M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6",
  },
  {
    href: "/#area-cliente",
    label: "Área do cliente",
    desc: "Em breve",
    icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6",
  },
];

export default function AcessoRapido({
  variant = "light",
  className = "",
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const btn =
    variant === "dark"
      ? "glass-dark text-paper"
      : "bg-white text-ink border border-line hover:border-accent";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`mono-label inline-flex w-full items-center justify-center gap-2 rounded px-4 py-2.5 transition ${btn}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Acesso rápido
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className={`transition ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 z-[60] mt-2 w-[280px] overflow-hidden rounded-lg border border-line shadow-2xl"
          style={{ backgroundColor: "#FFFFFF" }}
          role="menu"
        >
          {atalhos.map((a) => (
            <a
              key={a.href}
              href={a.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-line/70 bg-white px-4 py-4 transition last:border-b-0 hover:bg-bone"
              role="menuitem"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded bg-accent/10 text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d={a.icon} />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[14px] font-extrabold tracking-tight text-ink">{a.label}</span>
                <span className="block text-[12px] text-mute">{a.desc}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
