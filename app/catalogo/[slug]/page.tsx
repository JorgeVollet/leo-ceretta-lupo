import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCatalogo, linkPedido } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CatalogoPage({ params }: { params: { slug: string } }) {
  const cat = await getCatalogo(params.slug);
  if (!cat) notFound();

  return (
    <>
      <Header compact />
      <div className="mx-auto max-w-6xl px-5 py-7">
        <Link href="/" className="text-[13px] font-medium text-cloud/55 transition hover:text-accent-bright">
          &larr; Voltar aos catalogos
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-bright">
              {cat.segmento}
            </div>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-cloud md:text-4xl">
              {cat.titulo}
            </h1>
            <p className="mt-1.5 max-w-[60ch] text-[14px] text-cloud/55">{cat.descricao}</p>
          </div>
          <a
            href={linkPedido(cat.titulo, cat.segmento)}
            target="_blank"
            rel="noopener"
            className="shrink-0 rounded-xl bg-accent px-5 py-3 text-center text-[14px] font-semibold text-white transition hover:bg-accent-bright"
          >
            Fazer pedido
          </a>
        </div>

        <div className="mt-8">
          {cat.drive ? (
            <div className="overflow-hidden rounded-3xl border border-white/8 bg-navy-800/40">
              <div className="grid gap-0 md:grid-cols-[minmax(0,360px)_1fr]">
                {/* Capa + acoes (sempre visivel, funciona no celular) */}
                <div className="flex flex-col items-center gap-5 border-b border-white/8 p-7 md:border-b-0 md:border-r">
                  {cat.capa && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.capa}
                      alt={`Capa do catalogo ${cat.titulo}`}
                      className="w-full max-w-[300px] rounded-xl shadow-card ring-1 ring-white/10"
                    />
                  )}
                  <div className="flex w-full max-w-[300px] flex-col gap-2.5">
                    <a
                      href={cat.drive}
                      target="_blank"
                      rel="noopener"
                      className="rounded-xl bg-accent px-4 py-3.5 text-center text-[15px] font-semibold text-white transition hover:bg-accent-bright"
                    >
                      Abrir catalogo
                    </a>
                    <a
                      href={cat.drive}
                      target="_blank"
                      rel="noopener"
                      download
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-[14px] font-semibold text-cloud transition hover:border-accent/50 hover:bg-white/10"
                    >
                      Baixar PDF
                    </a>
                  </div>
                  <p className="text-center text-[12px] leading-relaxed text-cloud/40">
                    Toque em <span className="font-semibold text-cloud/70">Abrir catalogo</span> pra
                    visualizar todas as paginas no seu celular ou computador.
                  </p>
                </div>

                {/* Preview embutido — so no desktop (no mobile o iframe nao renderiza PDF) */}
                <div className="hidden bg-navy-900 md:block">
                  <iframe
                    src={`${cat.drive}#toolbar=1&view=FitH`}
                    title={cat.titulo}
                    className="h-[80vh] w-full"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-navy-800/50 py-14 text-center">
              {cat.capa && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cat.capa} alt={cat.titulo} className="h-44 w-auto rounded-xl object-contain shadow-card" />
              )}
              <div className="max-w-md px-6">
                <div className="font-display text-lg font-bold text-cloud">Catalogo completo</div>
                <p className="mt-1 text-[13.5px] text-cloud/50">
                  O catalogo deste segmento entra em breve. Por enquanto, faca seu pedido pelo WhatsApp.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
