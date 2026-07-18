import SectionLabel from "./SectionLabel";
import { CONTATO } from "@/lib/data";
import SplineBG from "./SplineBG";
import PoliticaComercial from "./PoliticaComercial";
import MateriaisModal from "./MateriaisModal";

const SPLINE_SRC =
  "https://my.spline.design/animatedbackgroundgradientforweb-jvJDeBWjMvShkjPKxPRUswLq";

const Ic = ({ d }: { d: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export default function Servicos() {
  return (
    <section id="servicos" className="bg-paper py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionLabel num="05">Serviços e suporte</SectionLabel>

        <div id="materiais" className="grid scroll-mt-24 gap-4 md:grid-cols-3">
          {/* Materiais — destaque grande, escuro (abre o modal de acesso) */}
          <MateriaisModal
            className="group relative flex w-full scroll-mt-24 flex-col justify-center overflow-hidden rounded-lg border border-ink bg-ink p-8 text-left text-paper shadow-card transition hover:border-accent md:col-span-2 md:row-span-3 md:p-10"
          >
            {/* navy sólido + Spline animado por cima (clique passa direto: pointer-events-none) */}
            <SplineBG src={SPLINE_SRC} />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-ink/35" />
            <div className="grain absolute inset-0 z-[1]" />
            <div className="relative z-10">
              <span className="mono-label text-accent-sky">S1 · Divulgação</span>
              <h3 className="headline mt-5 text-paper" style={{ fontSize: "clamp(2.1rem,5.2vw,3.8rem)" }}>
                MATERIAIS DE DIVULGAÇÃO
              </h3>
              <p className="mt-5 max-w-[46ch] text-[15.5px] leading-relaxed text-paper/70 md:text-[16.5px]">
                Baixe as fotos e artes oficiais dos produtos pra postar nas suas redes e
                anúncios. Conteúdo pronto pra vender mais.
              </p>
            </div>
            <span className="shimmer relative z-10 mt-7 inline-flex w-fit items-center gap-2 rounded bg-accent px-6 py-3.5 font-display text-[14.5px] font-bold uppercase tracking-wide text-paper transition group-hover:bg-accent-bright">
              Acessar materiais →
            </span>
          </MateriaisModal>

          {/* Rastreio */}
          <a id="rastreio" href={CONTATO.rastreio} target="_blank" rel="noopener" className="glow-ring group flex scroll-mt-24 flex-col gap-3 rounded-lg border border-line bg-white p-6 shadow-card transition hover:border-accent">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-accent/10 text-accent"><Ic d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></div>
              <span className="mono-label text-ink/20">S2</span>
            </div>
            <div>
              <h3 className="font-display text-[16px] font-extrabold tracking-tight text-ink">Rastrear entrega</h3>
              <p className="mt-1 text-[13px] text-mute">Acompanhe seu pedido pela Braspress.</p>
            </div>
          </a>

          {/* Boletos */}
          <a id="boletos" href={CONTATO.boletos} target="_blank" rel="noopener" className="glow-ring group flex scroll-mt-24 flex-col gap-3 rounded-lg border border-line bg-white p-6 shadow-card transition hover:border-accent">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-accent/10 text-accent"><Ic d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6" /></div>
              <span className="mono-label text-ink/20">S3</span>
            </div>
            <div>
              <h3 className="font-display text-[16px] font-extrabold tracking-tight text-ink">Portal de boletos</h3>
              <p className="mt-1 text-[13px] text-mute">Acesse seus boletos no portal da Lupo.</p>
            </div>
          </a>

          {/* Política comercial (abre modal) */}
          <PoliticaComercial variant="card" />
        </div>

        {/* ÁREA DO CLIENTE — EM BREVE (inclui devoluções) */}
        <div id="area-cliente" className="mt-4 overflow-hidden rounded-lg border border-line bg-white shadow-card">
          <div className="border-b border-line bg-bone px-7 py-6 md:px-10">
            <span className="mono-label inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-3 py-1 text-accent">
              ● Em breve
            </span>
            <h3 className="headline mt-4 text-ink" style={{ fontSize: "clamp(1.8rem,4.5vw,3.2rem)" }}>
              SUA ÁREA DO CLIENTE ESTÁ CHEGANDO
            </h3>
            <p className="mt-3 max-w-[60ch] text-[14.5px] leading-relaxed text-ink/65">
              Uma conta só pra facilitar o seu dia a dia: acompanhar pedidos, ver o status
              de cada entrega, acessar boletos, receber sugestões de reposição — e resolver
              devoluções sem complicação.
            </p>
          </div>

          <div className="grid gap-px bg-line md:grid-cols-2">
            <div className="bg-white p-7">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-accent/10 text-accent"><Ic d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></div>
              <h4 className="font-display text-[17px] font-extrabold tracking-tight text-ink">Pedidos e entregas</h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-mute">
                Acompanhe cada pedido — feito, faturado, despachado, a caminho e entregue —
                além de boletos e histórico de compras.
              </p>
            </div>
            <div className="bg-white p-7">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-accent/10 text-accent"><Ic d="M3 7v6h6M3 13a9 9 0 1 0 3-7" /></div>
              <h4 className="font-display text-[17px] font-extrabold tracking-tight text-ink">Devoluções e trocas</h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-mute">
                Defeito, falta ou sobra na nota? Você seleciona os itens, informa a
                quantidade e faz o upload do XML — tudo num só lugar. O resto a gente
                resolve com a Lupo (inclusive o PAC reverso).
              </p>
            </div>
          </div>
          <p className="border-t border-line px-7 py-4 text-[12.5px] text-mute md:px-10">
            Enquanto a área não chega, é só me chamar no WhatsApp que eu cuido das suas
            devoluções e pedidos.
          </p>
        </div>
      </div>
    </section>
  );
}
