import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CatalogosBrowser from "@/components/CatalogosBrowser";
import { getCatalogos } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CatalogosPage() {
  const catalogos = await getCatalogos();
  return (
    <>
      <Header compact />
      <main className="concreto bg-stone pb-10 pt-12">
        <div className="mx-auto max-w-6xl px-5">
          <span className="mono-label text-accent-deep">[ Catálogos ]</span>
          <h1 className="headline mt-4 text-ink" style={{ fontSize: "clamp(2.4rem,7vw,5rem)" }}>
            COLEÇÕES POR SEGMENTO
          </h1>
          <p className="mt-3 max-w-[54ch] text-[15px] leading-relaxed text-ink/80">
            Toque num catálogo pra ver as páginas, baixar o PDF ou já fazer o pedido pelo
            WhatsApp.
          </p>
        </div>
        <CatalogosBrowser catalogos={catalogos} />
      </main>
      <Footer />
    </>
  );
}
