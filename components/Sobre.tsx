import SectionLabel from "./SectionLabel";
import Reveal from "./Reveal";

const numeros = [
  { n: "14 anos", l: "de estrada em vendas" },
  { n: "+60", l: "cidades atendidas" },
  { n: "+500", l: "lojistas na carteira" },
  { n: "+100 anos", l: "de tradição da marca Lupo" },
];

export default function Sobre() {
  return (
    <section id="sobre" className="concreto sec-divider bg-stone py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionLabel num="01">Quem atende você</SectionLabel>

        <div className="grid gap-12 md:grid-cols-[1fr_360px] md:items-start">
          {/* texto */}
          <Reveal>
            <h2 className="headline text-ink" style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}>
              LEONARDO CERETTA
            </h2>
            <div className="mt-6 max-w-[58ch] space-y-4 text-[15px] leading-relaxed text-ink/80">
              <p>
                Sou Leonardo Ceretta Silveira, de Santo Ângelo, no Noroeste do Rio Grande
                do Sul. Há <span className="font-semibold text-ink">14 anos vivo de vendas</span> —
                e foi nelas que encontrei o meu lugar: estar presente, instruir, dar
                suporte e ajudar o lojista a vender mais.
              </p>
              <p>
                Antes da Lupo, passei por marcas de peso como Hope, Mash e Döhler. Quando
                veio a chance de representar a <span className="font-semibold text-ink">Lupo</span>,
                foi a realização de um objetivo: sempre quis trabalhar com a marca líder do
                segmento, uma empresa séria que busca excelência em tudo o que faz.
                Representar a Lupo é um privilégio que eu honro todos os dias.
              </p>
              <p>
                Meu jeito de atender se resume em poucas palavras:{" "}
                <span className="font-semibold text-ink">seriedade, honestidade, respeito
                e amizade</span> — sempre unidos a conhecimento de produto e muita vontade
                de resolver. Não desapareço depois do pedido: acompanho a entrega, ajudo na
                exposição do ponto de venda e na escolha do mix, porque sei que a sua loja
                só ganha quando o produto gira.
              </p>
            </div>

            {/* assinatura pessoal — o lema */}
            <figure className="mt-8 border-l-2 border-accent pl-5">
              <blockquote className="font-display text-[20px] font-extrabold italic leading-snug tracking-tight text-ink md:text-[24px]">
                “O homem é do tamanho dos seus sonhos.”
              </blockquote>
              <figcaption className="mono-label mt-2 text-accent-deep">— Leonardo Ceretta</figcaption>
            </figure>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="glass mono-label rounded px-3.5 py-2 text-ink/80">
                ◷ Atende a região Noroeste do RS
              </span>
              <span className="glass mono-label rounded px-3.5 py-2 text-ink/80">
                ★ Representante Oficial Lupo
              </span>
            </div>
          </Reveal>

          {/* foto do Leonardo */}
          <Reveal delay={150} className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-line shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sobre/leonardo.jpg"
                alt="Leonardo Ceretta, representante oficial Lupo"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {/* leve gradiente no rodapé pra assentar o selo */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(8,11,16,0.35))]" />
            </div>
            <div className="absolute -bottom-3 -left-3 flex items-center gap-2 rounded border border-accent/30 bg-white px-3.5 py-2.5 shadow-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#2563EB"><path d="M12 2l2.4 5.1 5.6.5-4.2 3.7 1.3 5.5L12 19.8 6.9 22.3l1.3-5.5L4 13.1l5.6-.5z" /></svg>
              <span className="mono-label text-ink">Oficial Lupo</span>
            </div>
          </Reveal>
        </div>

        {/* números */}
        <Reveal as="div" className="glass-grid mt-16 grid grid-cols-2 overflow-hidden rounded-lg md:grid-cols-4">
          {numeros.map((x, i) => (
            <div key={x.l} className={`glass-cell p-7 ${i < 3 ? "border-r border-white/35" : ""} ${i < 2 ? "border-b border-white/35 md:border-b-0" : ""} ${i === 2 ? "max-md:border-b-0" : ""}`}>
              <div className="headline text-ink" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>{x.n}</div>
              <div className="mt-1.5 text-[12.5px] leading-snug text-mute">{x.l}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
