"use client";

import Link from "next/link";
import ProdutosGrid from "@/components/ProdutosGrid";
import { useCliente } from "@/lib/cliente-auth";
import type { Produto } from "@/lib/data";

/**
 * Portão do catálogo de compra: só mostra a grade interativa (seleção de
 * produtos + carrinho) pra CLIENTE LOGADO. Quem não tem conta vê um aviso
 * e continua com o PDF logo abaixo. O `redirect` volta pra este catálogo
 * depois do login.
 */
export default function CatalogoCompra({
  produtos,
  catalogoSlug,
  catalogoTitulo,
  segmento,
}: {
  produtos: Produto[];
  catalogoSlug: string;
  catalogoTitulo: string;
  segmento: string;
}) {
  const { cliente, carregando } = useCliente();

  if (carregando) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-line bg-white py-16">
        <span className="mono-label text-mute">Carregando...</span>
      </div>
    );
  }

  if (cliente) {
    return (
      <ProdutosGrid
        produtos={produtos}
        catalogoSlug={catalogoSlug}
        catalogoTitulo={catalogoTitulo}
        segmento={segmento}
      />
    );
  }

  // não logado → aviso + CTA. PDF continua aparecendo na página.
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
      <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 11V8a6 6 0 1 1 12 0v3M5 11h14v10H5zM12 15v3" />
          </svg>
        </span>
        <div className="max-w-md">
          <h3 className="font-display text-[18px] font-extrabold tracking-tight text-ink">
            Catálogo de compra exclusivo para clientes
          </h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-mute">
            A seleção de produtos e o pedido pelo site são liberados para clientes cadastrados.
            Já é cliente do Leonardo? Crie seu acesso em 1 minuto usando seu CNPJ ou razão social.
            Você pode ver o catálogo completo em PDF logo abaixo.
          </p>
        </div>
        <div className="flex w-full max-w-[320px] flex-col gap-2.5">
          <Link
            href={`/entrar?redirect=${encodeURIComponent(`/catalogo/${catalogoSlug}`)}`}
            className="mono-label rounded bg-ink px-5 py-3.5 text-center text-paper transition hover:bg-accent"
          >
            Entrar / Criar acesso
          </Link>
        </div>
      </div>
    </div>
  );
}
