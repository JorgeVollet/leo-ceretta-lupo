"use client";

import { useEffect, useState } from "react";
import type { Produto } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { regraDoSegmento } from "@/lib/politica";

function parseTamanhos(tamanho: string): string[] {
  return tamanho
    .split("•")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function ProdutoModal({
  produto,
  catalogoSlug,
  catalogoTitulo,
  segmento,
  onClose,
}: {
  produto: Produto;
  catalogoSlug: string;
  catalogoTitulo: string;
  segmento: string;
  onClose: () => void;
}) {
  const { adicionarItem } = useCart();
  const tamanhos = parseTamanhos(produto.tamanho);
  const [tamanho, setTamanho] = useState(tamanhos[0] ?? "");
  const [cor, setCor] = useState(produto.cores[0]?.nome ?? "");
  const regra = regraDoSegmento(segmento);
  const [quantidade, setQuantidade] = useState(regra.multiplo);
  const [adicionado, setAdicionado] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(false);

  // grade completa deste produto: varias combinações de tamanho/cor/quantidade
  // acumuladas aqui antes de mandar tudo de uma vez pro carrinho.
  const [linhasGrade, setLinhasGrade] = useState<
    { tamanho: string; cor: string; quantidade: number; img: string }[]
  >([]);
  const totalGrade = linhasGrade.reduce((soma, l) => soma + l.quantidade, 0);

  // foto muda conforme a cor escolhida — cai pra foto padrão do produto se
  // essa cor ainda não tiver foto própria mapeada.
  const corSelecionada = produto.cores.find((c) => c.nome === cor);
  const imgExibida = corSelecionada?.img || produto.img;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fotoAmpliada) setFotoAmpliada(false);
        else onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, fotoAmpliada]);

  function adicionarNaGrade() {
    setLinhasGrade((linhas) => {
      const idx = linhas.findIndex((l) => l.tamanho === tamanho && l.cor === cor);
      if (idx >= 0) {
        const atualizadas = [...linhas];
        atualizadas[idx] = { ...atualizadas[idx], quantidade: atualizadas[idx].quantidade + quantidade };
        return atualizadas;
      }
      return [...linhas, { tamanho, cor, quantidade, img: imgExibida }];
    });
    setQuantidade(regra.multiplo);
  }

  function removerDaGrade(indice: number) {
    setLinhasGrade((linhas) => linhas.filter((_, i) => i !== indice));
  }

  function enviarGradeParaCarrinho() {
    if (linhasGrade.length === 0) return;
    linhasGrade.forEach((linha) => {
      adicionarItem({
        catalogoSlug,
        catalogoTitulo,
        segmento,
        codigo: produto.codigo,
        nome: produto.nome,
        tamanho: linha.tamanho,
        cor: linha.cor,
        quantidade: linha.quantidade,
        img: linha.img,
      });
    });
    setAdicionado(true);
    setTimeout(onClose, 900);
  }

  return (
    <>
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`Selecionar ${produto.nome}`}
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-2xl border border-line bg-white shadow-2xl sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* cabeçalho */}
        <div className="relative flex gap-4 border-b border-line p-5">
          <button
            type="button"
            onClick={() => imgExibida && setFotoAmpliada(true)}
            className="group relative h-36 w-36 flex-none overflow-hidden rounded border border-line bg-bone"
            aria-label="Ver foto ampliada"
          >
            {imgExibida && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={imgExibida}
                  src={imgExibida}
                  alt={`${produto.nome} — ${cor}`}
                  className="h-full w-full cursor-zoom-in object-cover transition group-hover:scale-105"
                />
                <span className="pointer-events-none absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-paper opacity-0 transition group-hover:opacity-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
                  </svg>
                </span>
              </>
            )}
          </button>
          <div className="min-w-0 pr-8">
            <span className="mono-label text-[10px] text-accent-deep">{produto.codigo}</span>
            <h3 className="font-display text-[16px] font-extrabold leading-snug tracking-tight text-ink">
              {produto.nome}
            </h3>
            {produto.linha && (
              <span className="mono-label mt-1 inline-block rounded bg-bone px-1.5 py-0.5 text-[9px] text-mute">
                {produto.linha}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink transition hover:bg-bone"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* corpo */}
        <div className="space-y-5 p-5">
          {tamanhos.length > 0 && (
            <div>
              <div className="mono-label mb-2 text-[11px] text-mute">Tamanho</div>
              <div className="flex flex-wrap gap-2">
                {tamanhos.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTamanho(t)}
                    className={`rounded border px-3 py-2 text-[12.5px] transition ${
                      tamanho === t ? "border-accent bg-accent text-paper" : "border-line bg-white text-ink hover:border-accent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {produto.cores.length > 0 && (
            <div>
              <div className="mono-label mb-2 text-[11px] text-mute">Cor</div>
              <div className="flex flex-wrap gap-2">
                {produto.cores.map((c) => (
                  <button
                    key={c.cod}
                    type="button"
                    onClick={() => setCor(c.nome)}
                    className={`rounded border px-3 py-2 text-[12.5px] transition ${
                      cor === c.nome ? "border-accent bg-accent text-paper" : "border-line bg-white text-ink hover:border-accent"
                    }`}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mono-label mb-2 text-[11px] text-mute">Quantidade (peças)</div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.max(regra.multiplo, q - regra.multiplo))}
                className="flex h-10 w-10 items-center justify-center rounded border border-line text-ink transition hover:border-accent"
                aria-label={`Diminuir ${regra.multiplo} peças`}
              >
                −
              </button>
              <span className="w-10 text-center font-display text-[16px] font-extrabold text-ink">{quantidade}</span>
              <button
                type="button"
                onClick={() => setQuantidade((q) => q + regra.multiplo)}
                className="flex h-10 w-10 items-center justify-center rounded border border-line text-ink transition hover:border-accent"
                aria-label={`Aumentar ${regra.multiplo} peças`}
              >
                +
              </button>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-mute">
              Política do segmento: <strong className="text-ink">{regra.descricao}</strong>. A quantidade
              já pula de {regra.multiplo} em {regra.multiplo} peças pra fechar certinho — dá pra combinar
              tamanhos e cores diferentes desse segmento no carrinho.
            </p>
            <button
              type="button"
              onClick={adicionarNaGrade}
              className="mono-label mt-3 w-full rounded border border-ink px-4 py-2.5 text-center text-ink transition hover:bg-ink hover:text-paper"
            >
              + Adicionar esta opção à grade
            </button>
          </div>

          {linhasGrade.length > 0 && (
            <div>
              <div className="mono-label mb-2 flex items-center justify-between text-[11px] text-mute">
                <span>Grade deste produto</span>
                <span className="text-ink">
                  {totalGrade} peça{totalGrade === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="divide-y divide-line overflow-hidden rounded border border-line">
                {linhasGrade.map((linha, i) => (
                  <li
                    key={`${linha.tamanho}__${linha.cor}`}
                    className="flex items-center justify-between gap-2 bg-white px-3 py-2 text-[12.5px] text-ink"
                  >
                    <span>
                      <strong>{linha.tamanho}</strong> • {linha.cor} • {linha.quantidade} peça
                      {linha.quantidade === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerDaGrade(i)}
                      aria-label={`Remover ${linha.tamanho} ${linha.cor} da grade`}
                      className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-mute transition hover:bg-bone hover:text-accent-deep"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* rodapé */}
        <div className="border-t border-line bg-bone px-5 py-4">
          <button
            type="button"
            onClick={enviarGradeParaCarrinho}
            disabled={linhasGrade.length === 0 || adicionado}
            className="mono-label w-full rounded bg-ink px-4 py-3.5 text-center text-paper transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {adicionado
              ? "Enviado ao carrinho ✓"
              : linhasGrade.length > 0
                ? `Enviar grade para o carrinho (${totalGrade} peça${totalGrade === 1 ? "" : "s"})`
                : "Adicione ao menos uma opção acima"}
          </button>
        </div>
      </div>
    </div>

    {fotoAmpliada && imgExibida && (
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/90 p-4"
        role="dialog"
        aria-modal="true"
        aria-label={`Foto ampliada — ${produto.nome} ${cor}`}
        onClick={() => setFotoAmpliada(false)}
      >
        <button
          type="button"
          onClick={() => setFotoAmpliada(false)}
          aria-label="Fechar foto ampliada"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-paper transition hover:bg-white/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgExibida}
          alt={`${produto.nome} — ${cor}`}
          className="max-h-[88vh] max-w-[92vw] rounded object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
    </>
  );
}
