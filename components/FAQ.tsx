"use client";
import { useState } from "react";
import SectionLabel from "./SectionLabel";

const itens = [
  { q: "Qual o pedido mínimo?", a: "O pedido mínimo é de R$ 1.000,00. As grades seguem múltiplos: lingerie, modeladores e cuecas em múltiplo de 3 (tamanho e cor); meias e meia-calça em múltiplo de 6; pijamas, blusas e Lupo Sport sortidas, mínimo 3 peças." },
  { q: "Como faço para comprar?", a: "Escolha os catálogos por segmento, veja as linhas e me chame no WhatsApp pra montar o pedido. Eu te passo as condições e cuido de tudo até a entrega." },
  { q: "Quais as formas de pagamento?", a: "Boleto (após análise financeira), cartão ou à vista. As condições especiais são combinadas no atendimento." },
  { q: "Qual o prazo de entrega?", a: "A entrega é feita conforme a disponibilidade do produto, em média 30 dias. Você acompanha o envio pelo rastreio da transportadora (Braspress)." },
  { q: "E se vier produto com defeito ou faltando?", a: "Sem stress. Você me envia as fotos e os dados da nota, e eu resolvo direto com a Lupo, inclusive o PAC reverso. Em breve isso será feito direto pela sua área do cliente." },
  { q: "Você atende presencialmente?", a: "Sim! Dá pra agendar atendimento presencial ou pelo WhatsApp. Assim garantimos melhor planejamento de compras e condições especiais." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-paper py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <SectionLabel num="07">Perguntas frequentes</SectionLabel>
        <div className="grid gap-10 md:grid-cols-[300px_1fr] md:items-start">
          <h2 className="headline text-ink" style={{ fontSize: "clamp(2rem,5vw,3.4rem)" }}>
            TIRE SUAS DÚVIDAS
          </h2>
          <div className="divide-y divide-line border-y border-line">
            {itens.map((it, i) => {
              const aberto = open === i;
              return (
                <div key={i}>
                  <button onClick={() => setOpen(aberto ? null : i)} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                    <span className="flex items-baseline gap-3">
                      <span className="mono-label text-accent-deep">0{i + 1}</span>
                      <span className="font-display text-[17px] font-bold tracking-tight text-ink">{it.q}</span>
                    </span>
                    <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border border-line text-ink/60 transition ${aberto ? "rotate-45 border-accent bg-accent text-paper" : ""}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ${aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <p className="pb-5 pl-9 text-[14px] leading-relaxed text-mute">{it.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
