import { CONTATO } from "@/lib/data";
import SplineBG from "./SplineBG";

const SPLINE_SRC =
  "https://my.spline.design/animatedbackgroundgradientforweb-jvJDeBWjMvShkjPKxPRUswLq";

export default function CTAFinal() {
  return (
    <section id="contato" className="relative overflow-hidden bg-ink py-20 md:py-28">
      {/* fundo navy sólido (bg-ink) + Spline animado por cima dele */}
      <SplineBG src={SPLINE_SRC} />
      {/* scrim leve por cima do Spline pra legibilidade (ainda atrás do texto) */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-ink/35" />
      <div className="grain absolute inset-0 z-[1]" />
      <div className="relative z-10 mx-auto max-w-4xl px-5 text-center">
        <span className="mono-label text-accent-sky">[08] Vamos conversar</span>
        <h2 className="headline mx-auto mt-5 max-w-[18ch] text-paper" style={{ fontSize: "clamp(2.4rem,7vw,5rem)" }}>
          PRODUTO E ATENDIMENTO DE EXCELÊNCIA PRA SUA LOJA.
        </h2>
        <p className="mx-auto mt-5 max-w-[52ch] text-[15px] leading-relaxed text-paper/65 md:text-lg">
          Pronto pra abastecer sua loja com a marca que vende sozinha? Me chama no WhatsApp
          e a gente monta o pedido com condições especiais, o mix certo e entrega no prazo
          combinado.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a href={`https://wa.me/${CONTATO.whatsapp}`} target="_blank" rel="noopener" className="shimmer rounded bg-accent px-8 py-4 font-display text-[15px] font-bold uppercase tracking-wide text-paper transition hover:bg-accent-bright">
            Falar no WhatsApp
          </a>
          <a href={`mailto:${CONTATO.email}`} className="rounded border border-white/20 bg-white/5 px-8 py-4 font-display text-[15px] font-bold uppercase tracking-wide text-paper transition hover:border-accent-sky">
            Enviar e-mail
          </a>
        </div>
        <div className="mono-label mt-8 text-paper/40">{CONTATO.email}</div>
      </div>
    </section>
  );
}
