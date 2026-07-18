// Regras de grade da política comercial, por segmento do catálogo.
// Fonte: COPY-SITE-LEONARDO.md / PoliticaComercial.tsx (política já publicada no site).
//
// "Grade em múltiplo de N" = a soma de peças pedidas daquele segmento (somando todos os
// tamanhos e cores escolhidos) precisa fechar em um múltiplo de N. Não validamos valor em
// R$ (não há preço extraído dos catálogos ainda) — só a contagem de peças por grade.

export type RegraGrade = {
  multiplo: number;
  descricao: string;
};

// Mapeamento pelo campo "segmento" da tabela/arquivo de catálogos.
const REGRAS_POR_SEGMENTO: Record<string, RegraGrade> = {
  "Íntimo Masculino": { multiplo: 3, descricao: "Grade em múltiplo de 3 (tamanho e cor)" }, // Cuecas
  "Íntimo Feminino": { multiplo: 3, descricao: "Grade em múltiplo de 3 (tamanho e cor)" }, // Lingerie, Loba
  Meias: { multiplo: 6, descricao: "Grade em múltiplo de 6" },
  Infantil: { multiplo: 6, descricao: "Grade em múltiplo de 6" }, // Meias Kids/Baby
  "Lupo Sport": { multiplo: 3, descricao: "Sortida, mínimo de 3 peças" },
  Praia: { multiplo: 3, descricao: "Sortida, mínimo de 3 peças" }, // Beachwear
  Internacional: { multiplo: 3, descricao: "Grade em múltiplo de 3 (tamanho e cor)" }, // UK
};

const REGRA_PADRAO: RegraGrade = { multiplo: 3, descricao: "Grade em múltiplo de 3" };

export function regraDoSegmento(segmento: string): RegraGrade {
  return REGRAS_POR_SEGMENTO[segmento] ?? REGRA_PADRAO;
}

export type ValidacaoGrade = {
  segmento: string;
  totalPecas: number;
  multiplo: number;
  descricao: string;
  ok: boolean;
  faltam: number; // peças que faltam pra fechar o próximo múltiplo (0 se já ok)
};

/**
 * Recebe uma lista de { segmento, quantidade } (um item por linha do carrinho) e devolve,
 * agrupado por segmento, se a grade fecha no múltiplo exigido pela política comercial.
 */
export function validarGrades(
  itens: { segmento: string; quantidade: number }[]
): ValidacaoGrade[] {
  const totais = new Map<string, number>();
  for (const item of itens) {
    totais.set(item.segmento, (totais.get(item.segmento) ?? 0) + item.quantidade);
  }

  return Array.from(totais.entries()).map(([segmento, totalPecas]) => {
    const regra = regraDoSegmento(segmento);
    const resto = totalPecas % regra.multiplo;
    const ok = resto === 0 && totalPecas > 0;
    const faltam = resto === 0 ? 0 : regra.multiplo - resto;
    return {
      segmento,
      totalPecas,
      multiplo: regra.multiplo,
      descricao: regra.descricao,
      ok,
      faltam,
    };
  });
}
