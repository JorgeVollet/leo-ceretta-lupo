import SectionLabel from "./SectionLabel";
import Reveal from "./Reveal";
import SplineBG from "./SplineBG";

const SPLINE_SRC =
  "https://my.spline.design/animatedbackgroundgradientforweb-jvJDeBWjMvShkjPKxPRUswLq";

const marcas = [
  "MEIAS", "MEIA-CALÇA", "LINGERIE", "CUECAS", "MODELADORES",
  "LUPO SPORT", "BEACHWEAR", "PIJAMAS", "INFANTIL",
];

// Os campeões de venda do Leonardo — selo "Mais vendidos"
const maisVendidos = ["Meias", "Lingerie", "Cuecas", "Lupo Sport"];

const motivos = [
  { k: "A1", t: "Líder que dá segurança", d: "Produto líder no segmento. Passa credibilidade pro consumidor final — o cliente entra na sua loja já confiando na marca." },
  { k: "A2", t: "A marca se vende sozinha", d: "Com a exposição adequada, a Lupo vende sozinha. E é aí que eu entro: ajudo você a montar a exposição e o mix certos pra acelerar o giro." },
  { k: "A3", t: "Melhor custo-benefício", d: "Qualidade reconhecida com o melhor custo-benefício do segmento. Recompra constante e margem saudável pra sua loja." },
  { k: "A4", t: "Linha completa, um só fornecedor", d: "Do íntimo ao esportivo, do adulto ao infantil. Você cobre várias frentes da loja com um único representante de confiança." },
];

export default function Marcas() {
  return (
    <>
      {/* AS MARCAS — marquee */}
      <section id="marcas" className="border-y border-line bg-paper py-14">
        <div className="mx-auto max-w-6xl px-5">
          <SectionLabel num="02">O portfólio que você leva</SectionLabel>
          <p className="-mt-4 mb-8 max-w-[64ch] text-[15px] leading-relaxed text-ink/80">
            Represento <span className="font-semibold text-ink">todo o mix Lupo</span>:
            meias, meia-calça, lingerie, cuecas, modeladores, Lupo Sport, beachwear,
            pijamas e linha infantil. Adulto e infantil, do íntimo ao esportivo — tudo com
            um só representante.
          </p>
        </div>
        <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="marquee-track flex shrink-0 items-center gap-12 pr-12">
            {[...marcas, ...marcas].map((m, i) => (
              <span key={i} className="headline whitespace-nowrap text-ink/25 transition hover:text-accent-deep" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* POR QUE REVENDER — CINZA (texto navy) */}
      <section className="concreto sec-divider bg-stone py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <SectionLabel num="03">Por que revender Lupo</SectionLabel>
          <h2 className="headline max-w-[16ch] text-ink" style={{ fontSize: "clamp(2rem,5vw,3.6rem)" }}>
            UMA MARCA QUE O BRASIL JÁ COMPRA.
          </h2>

          {/* selo: campeões de venda */}
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <span className="mono-label inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-paper">
              ★ Mais vendidos
            </span>
            {maisVendidos.map((m) => (
              <span key={m} className="glass mono-label rounded-full px-3 py-1 text-ink/80">
                {m}
              </span>
            ))}
          </div>

          <div className="glass-grid mt-12 grid overflow-hidden rounded-lg sm:grid-cols-2">
            {motivos.map((m, i) => (
              <Reveal
                key={m.t}
                delay={i * 110}
                className={`glass-cell group p-7 ${i % 2 === 0 ? "sm:border-r sm:border-white/35" : ""} ${i < 2 ? "border-b border-white/35 sm:[&:nth-child(2)]:border-b-0" : ""}`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="mono-label text-accent-deep">{m.k}</span>
                  <span className="mono-label text-ink/25">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-display text-[20px] font-extrabold tracking-tight text-ink">{m.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-mute">{m.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HISTÓRIA DA LUPO — navy sólido + Spline animado por cima */}
      <section className="relative overflow-hidden bg-ink py-20 md:py-28">
        <SplineBG src={SPLINE_SRC} />
        {/* scrim leve por cima do Spline (atrás do texto) */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-ink/35" />
        <div className="grain absolute inset-0 z-[1]" />
        <div className="relative z-10 mx-auto max-w-4xl px-5 text-center">
          <span className="mono-label text-accent-sky">[04] Tradição</span>
          <div className="headline mt-4 text-accent-sky/30" style={{ fontSize: "clamp(3.4rem,11vw,8rem)" }}>+100 ANOS</div>
          <h2 className="headline mx-auto mt-2 max-w-[18ch] text-paper" style={{ fontSize: "clamp(1.8rem,5vw,3.4rem)" }}>
            MAIS DE UM SÉCULO VESTINDO O BRASIL
          </h2>
          <p className="mx-auto mt-6 max-w-[58ch] text-[15px] leading-relaxed text-paper/65 md:text-lg">
            Fundada em 1921, a Lupo é uma das marcas mais tradicionais e queridas do país —
            líder no segmento, com mais de 100 anos de mercado. Meias, roupa íntima, moda
            praia e linha esportiva que atravessam gerações. Revender Lupo é levar pra sua
            loja uma marca que o brasileiro confia há mais de um século.
          </p>
        </div>
      </section>
    </>
  );
}
