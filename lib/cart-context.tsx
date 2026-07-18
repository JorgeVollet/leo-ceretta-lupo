"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { validarGrades, type ValidacaoGrade } from "./politica";

export type ItemCarrinho = {
  chave: string; // codigo + tamanho + cor — único por combinação escolhida
  catalogoSlug: string;
  catalogoTitulo: string;
  segmento: string;
  codigo: string;
  nome: string;
  tamanho: string;
  cor: string;
  quantidade: number;
  img: string;
};

type CartContextType = {
  itens: ItemCarrinho[];
  carregado: boolean;
  adicionarItem: (item: Omit<ItemCarrinho, "chave">) => void;
  atualizarQuantidade: (chave: string, quantidade: number) => void;
  removerItem: (chave: string) => void;
  limparCarrinho: () => void;
  totalPecas: number;
  validacoes: ValidacaoGrade[];
  podeFinalizarGrade: boolean;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "lupo_carrinho_v1";

function montarChave(codigo: string, tamanho: string, cor: string) {
  return `${codigo}__${tamanho}__${cor}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregado, setCarregado] = useState(false);

  // carrega do localStorage assim que monta no navegador
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(STORAGE_KEY);
      if (salvo) setItens(JSON.parse(salvo));
    } catch {
      // storage corrompido ou indisponível — segue com carrinho vazio
    } finally {
      setCarregado(true);
    }
  }, []);

  // salva a cada mudança (só depois do load inicial, senão sobrescreve com [])
  useEffect(() => {
    if (!carregado) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
    } catch {
      // quota de storage excedida etc. — ignora
    }
  }, [itens, carregado]);

  function adicionarItem(novo: Omit<ItemCarrinho, "chave">) {
    const chave = montarChave(novo.codigo, novo.tamanho, novo.cor);
    setItens((atual) => {
      const existente = atual.find((i) => i.chave === chave);
      if (existente) {
        return atual.map((i) =>
          i.chave === chave ? { ...i, quantidade: i.quantidade + novo.quantidade } : i
        );
      }
      return [...atual, { ...novo, chave }];
    });
  }

  function atualizarQuantidade(chave: string, quantidade: number) {
    setItens((atual) =>
      quantidade <= 0
        ? atual.filter((i) => i.chave !== chave)
        : atual.map((i) => (i.chave === chave ? { ...i, quantidade } : i))
    );
  }

  function removerItem(chave: string) {
    setItens((atual) => atual.filter((i) => i.chave !== chave));
  }

  function limparCarrinho() {
    setItens([]);
  }

  const totalPecas = useMemo(() => itens.reduce((soma, i) => soma + i.quantidade, 0), [itens]);

  const validacoes = useMemo(
    () => validarGrades(itens.map((i) => ({ segmento: i.segmento, quantidade: i.quantidade }))),
    [itens]
  );

  const podeFinalizarGrade = itens.length > 0 && validacoes.every((v) => v.ok);

  const value: CartContextType = {
    itens,
    carregado,
    adicionarItem,
    atualizarQuantidade,
    removerItem,
    limparCarrinho,
    totalPecas,
    validacoes,
    podeFinalizarGrade,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa ser usado dentro de <CartProvider>");
  return ctx;
}
