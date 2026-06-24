import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sobre from "@/components/Sobre";
import Marcas from "@/components/Marcas";
import Servicos from "@/components/Servicos";
import ComoFunciona from "@/components/ComoFunciona";
import MarqueeBar from "@/components/MarqueeBar";
import FAQ from "@/components/FAQ";
import CTAFinal from "@/components/CTAFinal";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Header />
      <MarqueeBar />
      <Sobre />
      <Servicos />
      <Marcas />

      {/* Chamada pros catálogos — CINZA (texto navy) */}
      <section className="concreto sec-divider bg-stone py-20 text-ink md:py-24">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <span className="mono-label text-accent-deep">[ Catálogos ]</span>
          <h2 className="headline mx-auto mt-4 max-w-[18ch] text-ink" style={{ fontSize: "clamp(2rem,6vw,4rem)" }}>
            VEJA A LINHA COMPLETA POR SEGMENTO
          </h2>
          <p className="mx-auto mt-4 max-w-[50ch] text-[15px] leading-relaxed text-ink/80 md:text-lg">
            Meias, íntimo, infantil, praia e esporte. Navegue, baixe os catálogos e faça
            seu pedido.
          </p>
          <Link
            href="/catalogos"
            className="mt-8 inline-flex items-center gap-2 rounded bg-accent px-8 py-4 font-display text-[15px] font-bold uppercase tracking-wide text-paper transition hover:bg-accent-bright"
          >
            Ver catálogos →
          </Link>
        </div>
      </section>

      <ComoFunciona />
      <FAQ />
      <CTAFinal />
      <Footer />
    </>
  );
}
