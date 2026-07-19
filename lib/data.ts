// Camada de dados.
// Por padrão lê dos arquivos locais em /data (site funciona na hora).
// Se as variáveis do Supabase estiverem setadas, lê do banco.

import catalogosLocal from "@/data/catalogos.json";
import produtosCuecas from "@/data/produtos-cuecas.json";
import produtosLoba from "@/data/produtos-loba.json";
import produtosBeachwear from "@/data/produtos-beachwear.json";
import produtosMeiasSport from "@/data/produtos-meias-sport.json";
import produtosMeiasFemininas from "@/data/produtos-meias-femininas.json";
import produtosMeiasMasculinas from "@/data/produtos-meias-masculinas.json";
import produtosMeiasLicenciadas from "@/data/produtos-meias-licenciadas.json";
import produtosMeiasKids from "@/data/produtos-meias-kids.json";
import produtosMeiasBaby from "@/data/produtos-meias-baby.json";
import produtosUk from "@/data/produtos-uk.json";
import produtosLsport from "@/data/produtos-lsport.json";
import produtosLingerie from "@/data/produtos-lingerie.json";

export type Cor = { cod: string; nome: string; img?: string };
export type Produto = {
  codigo: string;
  nome: string;
  descricao: string;
  tamanho: string;
  linha: string;
  cores: Cor[];
  img: string;
};
export type Catalogo = {
  slug: string;
  titulo: string;
  segmento: string;
  descricao: string;
  drive: string;
  capa: string;
  navegavel: boolean;
  total_produtos: number | null;
};

const USA_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Contato do Leonardo (centralizado)
export const CONTATO = {
  whatsapp: "5555996267835",
  email: "leonardocerettasilveira@gmail.com",
  instagram: "leonardorepresentante_",
  instagramUrl: "https://instagram.com/leonardorepresentante_",
  rastreio: "https://www.braspress.com/",
  boletos: "https://lupo.portaldocliente.online/",
};

// Produtos locais por slug de catálogo (fallback e uso padrão sem Supabase).
// Pra ativar um novo catálogo navegável: gere data/produtos-<slug>.json (mesmo
// formato dos outros) e acrescente uma linha aqui — não precisa mexer em mais
// nada nesta função.
const PRODUTOS_LOCAIS: Record<string, { produtos: Produto[] }> = {
  cuecas: produtosCuecas as any,
  loba: produtosLoba as any,
  beachwear: produtosBeachwear as any,
  "meias-sport": produtosMeiasSport as any,
  "meias-femininas": produtosMeiasFemininas as any,
  "meias-masculinas": produtosMeiasMasculinas as any,
  "meias-licenciadas": produtosMeiasLicenciadas as any,
  "meias-kids": produtosMeiasKids as any,
  "meias-baby": produtosMeiasBaby as any,
  uk: produtosUk as any,
  lsport: produtosLsport as any,
  lingerie: produtosLingerie as any,
};

export async function getCatalogos(): Promise<Catalogo[]> {
  if (USA_SUPABASE) {
    const { supabase } = await import("./supabase");
    const { data } = await supabase!
      .from("catalogos")
      .select("*")
      .eq("ativo", true)
      .order("ordem");
    if (data && data.length) {
      const baseStorage = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalogos/`;
      return data.map((c: any) => {
        // anti-cache: usa updated_at/criado_em da linha como "versao".
        // Quando o PDF for trocado e a linha atualizada, o link muda e fura o cache do CDN.
        const carimbo = c.updated_at || c.atualizado_em || c.criado_em || c.versao || "";
        const v = carimbo ? `?v=${encodeURIComponent(String(carimbo))}` : "";
        return {
          slug: c.slug,
          titulo: c.titulo,
          segmento: c.segmento,
          descricao: c.descricao ?? "",
          // link de download direto do Supabase Storage (sem Drive, sem login)
          drive: c.arquivo ? baseStorage + encodeURIComponent(c.arquivo) + v : "",
          // capa servida pelo proprio site (public/capas/<slug>.jpg)
          capa: c.capa_url || `/capas/${c.slug}.jpg`,
          // grade de produtos clicavel ativada por catalogo (ver PRODUTOS_LOCAIS / tabela "produtos" no Supabase)
          navegavel: !!c.navegavel,
          total_produtos: null,
        };
      });
    }
  }
  return catalogosLocal as Catalogo[];
}

export async function getCatalogo(slug: string): Promise<Catalogo | null> {
  const todos = await getCatalogos();
  return todos.find((c) => c.slug === slug) ?? null;
}

export async function getProdutos(slug: string): Promise<Produto[]> {
  if (USA_SUPABASE) {
    const { supabase } = await import("./supabase");
    const { data } = await supabase!
      .from("produtos")
      .select("*")
      .eq("catalogo_slug", slug)
      .order("ordem");
    if (data && data.length) {
      return data.map((p: any) => ({
        codigo: p.codigo,
        nome: p.nome,
        descricao: p.descricao ?? "",
        tamanho: p.tamanho ?? "",
        linha: p.linha ?? "",
        cores: p.cores ?? [],
        img: p.img_url ?? "",
      }));
    }
  }
  return (PRODUTOS_LOCAIS[slug]?.produtos as Produto[]) ?? [];
}

export function getSegmentos(catalogos: Catalogo[]): string[] {
  return Array.from(new Set(catalogos.map((c) => c.segmento)));
}

export function linkPedido(titulo: string, segmento: string): string {
  const msg = `Olá Leonardo! Tenho interesse no catálogo *${titulo}* (${segmento}). Pode me passar mais informações?`;
  return `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(msg)}`;
}

export function linkPedidoProduto(codigo: string, nome: string): string {
  const msg = `Olá Leonardo! Quero pedir o produto *${nome}* (cód. ${codigo}). Pode me ajudar?`;
  return `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(msg)}`;
}
