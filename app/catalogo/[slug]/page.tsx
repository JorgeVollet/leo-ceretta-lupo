import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoliticaComercial from "@/components/PoliticaComercial";
import CatalogoCompra from "@/components/CatalogoCompra";
import { getCatalogo, getProdutos, linkPedido } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CatalogoPage({ params }: { params: { slug: string } }) {
  const cat = await getCatalogo(params.slug);
  if (!cat) notFound();

  // Validação temporária: mostra a grade de produtos (quando existem) e o PDF completo
  // juntos na mesma página, sem depender do campo "navegavel" do banco.
  const produtos = await getProdutos(cat.slug);

  return (
    <>
      <Header compact />
      <main className="bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <Link href="/catalogos" className="mono-label text-ink/70 transition hover:text-accent-deep">
            &larr; Voltar aos catalogos
          </Link>

          <div className="mt-5 flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="mono-label text-accent-deep">{cat.segmento}</span>
              <h1 className="headline mt-2 text-ink" style={{ fontSize: "clamp(2.2rem,6vw,4.2rem)" }}>
                {cat.titulo}
              </h1>
              <p className="mt-2 max-w-[60ch] text-[14px] text-mute">{cat.descricao}</p>
            </div>
            <a
              href={linkPedido(cat.titulo, cat.segmento)}
              target="_blank"
              rel="noopener"
              className="mono-label shrink-0 rounded bg-ink px-6 py-3.5 text-center text-paper transition hover:bg-accent"
            >
              Fazer pedido
            </a>
          </div>

          <div className="mt-8 space-y-10">
            {produtos.length > 0 && (
              <CatalogoCompra
                produtos={produtos}
                catalogoSlug={cat.slug}
                catalogoTitulo={cat.titulo}
                segmento={cat.segmento}
              />
            )}

            {cat.drive ? (
              <div>
                {produtos.length > 0 && (
                  <h2 className="mb-4 font-display text-xl font-extrabold tracking-tight text-ink">
                    Catalogo completo em PDF
                  </h2>
                )}
                <div className="overflow-hidden rounded-lg border border-line bg-white">
                  <div className="grid gap-0 md:grid-cols-[minmax(0,360px)_1fr]">
                    {/* capa + acoes (mobile-friendly) */}
                    <div className="flex flex-col items-center gap-5 border-b border-line p-7 md:border-b-0 md:border-r">
                      {cat.capa && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cat.capa} alt={`Capa do catalogo ${cat.titulo}`} className="w-full max-w-[300px] rounded border border-line shadow-soft" />
                      )}
                      <div className="flex w-full max-w-[300px] flex-col gap-2.5">
                        <a href={cat.drive} target="_blank" rel="noopener" className="mono-label rounded bg-accent px-4 py-3.5 text-center text-paper transition hover:bg-accent-bright">
                          Abrir catalogo
                        </a>
                        <a href={cat.drive} target="_blank" rel="noopener" download className="mono-label rounded border border-line bg-white px-4 py-3 text-center text-ink transition hover:border-accent">
                          Baixar PDF
                        </a>
                        <PoliticaComercial variant="botao" className="mt-1.5" />
                      </div>
                      <p className="text-center text-[12px] leading-relaxed text-mute">
                        Toque em <span className="font-semibold text-ink">Abrir catalogo</span> pra
                        ver todas as paginas no celular ou computador.
                      </p>
                    </div>
                    {/* preview embutido — desktop */}
                    <div className="hidden bg-bone md:block">
                      <iframe src={`${cat.drive}#toolbar=1&view=FitH`} title={cat.titulo} className="h-[80vh] w-full" loading="lazy" />
                    </div>
                  </div>
                </div>
              </div>
            ) : produtos.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-lg border border-line bg-white py-14 text-center">
                {cat.capa && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.capa} alt={cat.titulo} className="h-44 w-auto rounded border border-line object-contain shadow-soft" />
                )}
                <div className="max-w-md px-6">
                  <div className="font-display text-lg font-extrabold tracking-tight text-ink">Catalogo completo</div>
                  <p className="mt-1 text-[13.5px] text-mute">O catalogo deste segmento entra em breve. Por enquanto, faca seu pedido pelo WhatsApp.</p>
                </div>
                <div className="w-full max-w-[320px] px-6">
                  <PoliticaComercial variant="botao" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
