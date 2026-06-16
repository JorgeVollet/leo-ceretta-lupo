import SectionLabel from "./SectionLabel";
import Reveal from "./Reveal";

const passos = [
  {
    n: "01",
    t: "Você me chama",
    d: "WhatsApp, visita ou telefone. Eu também prospecto e vou até você — o primeiro contato é sempre fácil.",
  },
  {
    n: "02",
    t: "Apresento tudo",
    d: "Produto, política comercial e os motivos pra ter Lupo na sua loja. Sem enrolação, com o mix certo pro seu público.",
  },
  {
    n: "03",
    t: "Fechamos o pedido",
    d: "Monto o pedido com você, com todo o suporte e orientação de mix pra acelerar o giro.",
  },
  {
    n: "04",
    t: "Acompanho o pós-venda",
    d: "Acompanho a entrega, ajudo na exposição do ponto de venda e na reposição. Você nunca fica no escuro.",
  },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="concreto sec-divider bg-stone py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionLabel num="06">Como funciona o pedido</SectionLabel>
        <Reveal as="h2" className="headline text-ink md:max-w-[55%]" >
          <span style={{ fontSize: "clamp(2rem,5vw,3.6rem)", display: "block" }}>DO PRIMEIRO OI AO PÓS-VENDA.</span>
        </Reveal>
        <Reveal as="p" delay={80} className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-ink/80 md:text-lg">
          Atendimento próximo do começo ao fim. Simples e sem burocracia.
        </Reveal>

        <div className="glass-grid mt-12 grid overflow-hidden rounded-lg sm:grid-cols-2 lg:grid-cols-4">
          {passos.map((p, i) => (
            <Reveal
              key={p.n}
              delay={i * 90}
              className={`glass-cell border-b border-white/35 p-7 last:border-b-0 sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(odd)]:border-white/35 lg:border-b-0 lg:[&:not(:last-child)]:border-r`}
            >
              <div className="headline text-accent/30" style={{ fontSize: "clamp(2.6rem,5vw,3.4rem)" }}>
                {p.n}
              </div>
              <h3 className="mt-3 font-display text-[18px] font-extrabold tracking-tight text-ink">
                {p.t}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-mute">{p.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
