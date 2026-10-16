"use client";

import ProdutosGrid from "@/components/ProdutosGrid";
import { useCliente } from "@/lib/cliente-auth";
import type { Produto } from "@/lib/data";

/**
 * Catálogo de compra (seleção de produtos + carrinho).
 * Desde 16/10/2026 é ABERTO: quem não tem conta monta o pedido e, no fim do
 * carrinho, informa nome, telefone, empresa, CNPJ e e-mail (pedido sem conta).
 * Quem está logado segue igual — o pedido fica no nome dele e aparece em "Meus pedidos".
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

  return (
    <>
      {!carregando && !cliente && (
        <p className="mb-3 rounded-lg border border-accent/25 bg-accent/5 px-4 py-3 text-[13px] leading-relaxed text-mute">
          <b className="text-ink">Monte seu pedido direto aqui</b> — não precisa de conta. No fim do carrinho você
          informa seus dados e o pedido vai pro Leonardo.{" "}
          <a
            href={`/entrar?redirect=${encodeURIComponent(`/catalogo/${catalogoSlug}`)}`}
            className="font-semibold text-accent-deep underline underline-offset-2"
          >
            Já tenho conta
          </a>
        </p>
      )}
      <ProdutosGrid
        produtos={produtos}
        catalogoSlug={catalogoSlug}
        catalogoTitulo={catalogoTitulo}
        segmento={segmento}
      />
    </>
  );
}
