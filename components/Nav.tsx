"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { CONTATO } from "@/lib/data";
import AcessoRapido from "./AcessoRapido";

const navLinks = [
  { label: "Catálogos", href: "/catalogos" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Marcas", href: "/#marcas" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Dúvidas", href: "/#faq" },
];

/**
 * Nav com comportamento "hide on scroll down / show on scroll up".
 * variant="hero" → começa transparente sobre o vídeo; vira sólida ao descolar do topo.
 * variant="solid" → sempre clara (páginas internas).
 */
export default function Nav({ variant = "solid" }: { variant?: "hero" | "solid" }) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // só esconde depois de passar do topo; mostra ao subir
      if (y > lastY.current && y > 120) setHidden(true);
      else setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroAtTop = variant === "hero" && !scrolled;
  const darkLogo = variant === "hero";

  // fundo: hero no topo = vidro escuro translúcido; ao rolar = navy sólido com blur.
  // solid (páginas internas) = sempre branco com blur.
  const bg =
    variant === "hero"
      ? scrolled
        ? "bg-ink/90 backdrop-blur-xl border-white/10"
        : "bg-ink/30 backdrop-blur-md border-white/10"
      : "bg-paper/90 backdrop-blur-xl border-line";

  const linkColor = variant === "hero" ? "text-paper/70 hover:text-paper" : "text-ink/70 hover:text-ink";
  const pedidoBtn =
    variant === "hero"
      ? "bg-accent text-paper hover:bg-accent-bright"
      : "bg-ink text-paper hover:bg-accent";

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b transition-transform duration-300 will-change-transform ${bg} ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5">
        <Link href="/" aria-label="Início">
          <Logo dark={darkLogo} />
        </Link>
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className={`nav-underline mono-label rounded px-3 py-2 transition ${linkColor}`}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          {/* Acesso rápido — desktop (ao lado do Fazer pedido) */}
          <AcessoRapido variant="light" className="hidden lg:block" />
          <a
            href={`https://wa.me/${CONTATO.whatsapp}`}
            target="_blank"
            rel="noopener"
            className={`mono-label inline-flex items-center gap-2 rounded px-4 py-2.5 transition ${pedidoBtn}`}
          >
            Fazer pedido
          </a>
        </div>
      </div>
    </nav>
  );
}
