"use client";

import Link from "next/link";
import { CONTATO } from "@/lib/data";
import { useCliente } from "@/lib/cliente-auth";
import PoliticaComercial from "@/components/PoliticaComercial";

/**
 * ACESSO RÁPIDO — tudo numa tela só, pensado pro celular.
 * A página inteira cabe na altura da tela (100dvh) sem rolar: os blocos do meio
 * esticam ou encolhem conforme o aparelho. Em tela baixa (iPhone SE com a barra do
 * Safari aberta, ~550px) as descrições somem e fica só ícone + nome.
 */

type Atalho = {
  n: string;
  titulo: string;
  desc: string;
  icon: string;
  href?: string;
  externo?: boolean;
  politica?: true;
};

const ICON = {
  carrinho: "M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  livro: "M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zM4 20a2 2 0 0 0 2 1h13v-3M9 7h6M9 11h4",
  caixa: "M3 7h13v10H3zM16 10h3l2 3v4h-5zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  boleto: "M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6",
  imagem: "M4 5h16v14H4zM4 15l4-4 3 3 4-5 5 6M9 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  doc: "M8 3h8l4 4v14H4V3h4zM15 3v5h5M8 12h8M8 16h6",
  usuario: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6",
  insta: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.5 6.5h.01",
  seta: "M5 12h14M13 6l6 6-6 6",
  externo: "M7 17L17 7M9 7h8v8",
};

const ATALHOS: Atalho[] = [
  { n: "02", titulo: "Catálogos", desc: "Todos em PDF", icon: ICON.livro, href: "/catalogos" },
  { n: "03", titulo: "Meus pedidos", desc: "Status e entrega", icon: ICON.caixa, href: "/meus-pedidos" },
  { n: "04", titulo: "Rastrear", desc: "Entrega Braspress", icon: ICON.pin, href: CONTATO.rastreio, externo: true },
  { n: "05", titulo: "Boletos", desc: "Portal do cliente Lupo", icon: ICON.boleto, href: CONTATO.boletos, externo: true },
  { n: "06", titulo: "Materiais", desc: "Fotos e artes pra postar", icon: ICON.imagem, href: "/materiais" },
  { n: "07", titulo: "Política", desc: "Mínimo, grades, prazo", icon: ICON.doc, politica: true },
];

const Ic = ({ d, size = 22, className = "" }: { d: string; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d={d} />
  </svg>
);

// tela baixa: esconde o texto de apoio pra caber tudo sem rolar
const BAIXA = "[@media(max-height:640px)]:hidden";

// estilo único de bloco (link e botão)
const BLOCO =
  "acesso-bloco group relative flex min-h-[64px] flex-col justify-between overflow-hidden rounded-xl border border-white/10 " +
  "bg-white/[0.06] p-3 text-left text-paper backdrop-blur-sm transition active:scale-[0.97] " +
  "hover:border-accent-sky/50 hover:bg-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky";

function ConteudoBloco({ a }: { a: Atalho }) {
  return (
    <>
      <div className="flex items-start justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-sky/15 text-accent-sky transition group-hover:bg-accent-sky group-hover:text-navy-900">
          <Ic d={a.icon} size={19} />
        </span>
        <span className="mono-label !text-[9.5px] text-paper/30">
          {a.externo ? <Ic d={ICON.externo} size={13} className="text-paper/45" /> : a.n}
        </span>
      </div>
      <div className="mt-2">
        <div className="font-display text-[15.5px] font-extrabold leading-tight tracking-tight">{a.titulo}</div>
        <div className={`mt-0.5 text-[11.5px] leading-snug text-paper/55 ${BAIXA}`}>{a.desc}</div>
      </div>
    </>
  );
}

export default function AcessoRapidoPage() {
  const { cliente, carregando } = useCliente();
  const primeiroNome = (cliente?.nome_contato || "").trim().split(/\s+/)[0] || "";
  const logado = !!cliente;
  const linkPedido = logado ? "/catalogos" : "/entrar?redirect=/catalogos";
  const wa = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent("Olá Leonardo! Vim pelo acesso rápido do site.")}`;

  return (
    <main className="acesso-fundo relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-navy-900 text-paper">
      {/* atmosfera: brilho azul + grade de planta + grão */}
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 -z-10 h-[340px] w-[340px] rounded-full bg-accent/35 blur-[90px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 -z-10 h-[300px] w-[300px] rounded-full bg-accent-sky/15 blur-[90px]" />
      <div aria-hidden className="acesso-grade pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="grain pointer-events-none absolute inset-0 -z-10" />

      <div
        className="mx-auto flex w-full max-w-[460px] flex-1 flex-col gap-2.5 px-4 sm:my-auto sm:max-h-[860px] sm:py-8"
        style={{ paddingTop: "max(14px, env(safe-area-inset-top))", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {/* TOPO */}
        <header className="acesso-in flex items-center justify-between gap-3" style={{ animationDelay: "0ms" }}>
          <Link href="/" className="leading-none" aria-label="Ir pro site">
            <div className="font-display text-[17px] font-extrabold uppercase tracking-tight">Leonardo Ceretta</div>
            <div className="mono-label mt-1 !text-[9.5px] text-accent-sky">Representante oficial Lupo · RS</div>
          </Link>
          {carregando ? (
            <span className="h-8 w-20" />
          ) : logado ? (
            <Link href="/meus-pedidos" className="mono-label flex max-w-[45%] items-center gap-1.5 truncate rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 !text-[10px] text-paper/85">
              <span className="h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
              <span className="truncate">{primeiroNome ? `Olá, ${primeiroNome}` : "Conectado"}</span>
            </Link>
          ) : (
            <Link href="/entrar?redirect=/acesso" className="mono-label flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 !text-[10px] text-paper/85 transition hover:border-accent-sky">
              <Ic d={ICON.usuario} size={13} />
              Entrar
            </Link>
          )}
        </header>

        {/* FAZER PEDIDO — o principal */}
        <Link
          href={linkPedido}
          className="acesso-in shimmer group relative flex items-center gap-3.5 overflow-hidden rounded-2xl bg-accent px-4 py-4 shadow-[0_18px_40px_-14px_rgba(37,99,235,0.85)] transition active:scale-[0.98] hover:bg-accent-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
          style={{ animationDelay: "60ms" }}
        >
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-white/15 text-paper">
            <Ic d={ICON.carrinho} size={24} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="mono-label block !text-[9.5px] text-paper/70">01 · Comprar</span>
            <span className="mt-0.5 block font-display text-[21px] font-black uppercase leading-none tracking-tight">Fazer pedido</span>
            <span className={`mt-1 block text-[12px] leading-snug text-paper/80 ${BAIXA}`}>
              {logado ? "Escolha os produtos no catálogo" : "Entre ou crie sua conta em 1 minuto"}
            </span>
          </span>
          <Ic d={ICON.seta} size={22} className="flex-none transition group-hover:translate-x-1" />
        </Link>

        {/* GRADE DE ATALHOS — estica pra ocupar a tela, sem rolar */}
        <nav aria-label="Atalhos" className="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-2.5">
          {ATALHOS.map((a, i) => {
            const estilo = { animationDelay: `${120 + i * 45}ms` };
            if (a.politica) {
              return (
                <PoliticaComercial
                  key={a.n}
                  gatilho={(abrir) => (
                    <button type="button" onClick={abrir} aria-haspopup="dialog" className={`acesso-in ${BLOCO}`} style={estilo}>
                      <ConteudoBloco a={a} />
                    </button>
                  )}
                />
              );
            }
            return a.externo ? (
              <a key={a.n} href={a.href} target="_blank" rel="noopener" className={`acesso-in ${BLOCO}`} style={estilo}>
                <ConteudoBloco a={a} />
              </a>
            ) : (
              <Link key={a.n} href={a.href!} className={`acesso-in ${BLOCO}`} style={estilo}>
                <ConteudoBloco a={a} />
              </Link>
            );
          })}
        </nav>

        {/* WHATSAPP + INSTAGRAM */}
        <div className="acesso-in flex gap-2.5" style={{ animationDelay: "420ms" }}>
          <a
            href={wa}
            target="_blank"
            rel="noopener"
            className="flex min-h-[54px] flex-1 items-center gap-3 rounded-2xl bg-[#25D366] px-4 text-[#06241a] shadow-[0_14px_32px_-14px_rgba(37,211,102,0.8)] transition active:scale-[0.98] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#06241a" aria-hidden="true" className="flex-none">
              <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.6.2-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.1-.6-1.5-.8-2-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.2-.6-.3z M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
            </svg>
            <span className="min-w-0 leading-tight">
              <span className="block font-display text-[15px] font-extrabold">Falar com o Leonardo</span>
              <span className={`block text-[11.5px] font-medium opacity-75 ${BAIXA}`}>WhatsApp · resposta rápida</span>
            </span>
          </a>
          <a
            href={CONTATO.instagramUrl}
            target="_blank"
            rel="noopener"
            aria-label="Instagram do Leonardo"
            className="flex min-h-[54px] w-[54px] flex-none items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-paper transition active:scale-[0.96] hover:border-accent-sky/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
          >
            <Ic d={ICON.insta} size={22} />
          </a>
        </div>

        {/* RODAPÉ */}
        <div className="acesso-in flex items-center justify-between px-1 pt-0.5" style={{ animationDelay: "470ms" }}>
          <Link href="/" className="mono-label !text-[9.5px] text-paper/45 transition hover:text-paper">← Site completo</Link>
          <span className="mono-label !text-[9.5px] text-paper/30">Coleção 26 / 27</span>
        </div>
      </div>
    </main>
  );
}
