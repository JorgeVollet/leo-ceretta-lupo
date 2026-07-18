import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

type ItemPedido = {
  catalogoSlug: string;
  catalogoTitulo: string;
  segmento: string;
  codigo: string;
  nome: string;
  tamanho: string;
  cor: string;
  quantidade: number;
};

type PayloadPedido = {
  cliente: {
    nome: string;
    loja?: string;
    whatsapp: string;
    email?: string;
    cidade?: string;
    observacoes?: string;
  };
  itens: ItemPedido[];
};

function montarResumoTexto(payload: PayloadPedido, totalPecas: number) {
  const linhas = payload.itens.map(
    (i) =>
      `- ${i.nome} (cód. ${i.codigo}) | ${i.catalogoTitulo} | Tam. ${i.tamanho} | Cor ${i.cor} | ${i.quantidade}x`
  );
  return [
    `Novo pedido pelo site — ${payload.cliente.nome}`,
    payload.cliente.loja ? `Loja: ${payload.cliente.loja}` : null,
    `WhatsApp: ${payload.cliente.whatsapp}`,
    payload.cliente.cidade ? `Cidade: ${payload.cliente.cidade}` : null,
    payload.cliente.email ? `E-mail: ${payload.cliente.email}` : null,
    "",
    `Itens (${totalPecas} peça${totalPecas === 1 ? "" : "s"} no total):`,
    ...linhas,
    payload.cliente.observacoes ? `\nObservações: ${payload.cliente.observacoes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  let payload: PayloadPedido;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  if (!payload?.cliente?.nome?.trim() || !payload?.cliente?.whatsapp?.trim()) {
    return NextResponse.json({ erro: "Nome e WhatsApp são obrigatórios" }, { status: 400 });
  }
  if (!Array.isArray(payload.itens) || payload.itens.length === 0) {
    return NextResponse.json({ erro: "Carrinho vazio" }, { status: 400 });
  }

  const totalPecas = payload.itens.reduce((soma, i) => soma + (Number(i.quantidade) || 0), 0);
  const catalogoSlug = payload.itens[0]?.catalogoSlug ?? "";

  // 1) salva no Supabase — segue funcionando mesmo se o e-mail falhar depois.
  if (supabase) {
    const { error } = await supabase.from("pedidos").insert({
      status: "novo",
      cliente_nome: payload.cliente.nome,
      cliente_loja: payload.cliente.loja || null,
      cliente_whatsapp: payload.cliente.whatsapp,
      cliente_email: payload.cliente.email || null,
      cliente_cidade: payload.cliente.cidade || null,
      catalogo_slug: catalogoSlug,
      itens: payload.itens,
      total_pecas: totalPecas,
      observacoes: payload.cliente.observacoes || null,
    });
    if (error) {
      console.error("Erro ao salvar pedido no Supabase:", error.message);
      return NextResponse.json({ erro: "Não foi possível salvar o pedido" }, { status: 500 });
    }
  } else {
    console.warn("Supabase não configurado — pedido não foi salvo no banco.");
  }

  // 2) envia e-mail pro Leonardo via Resend (opcional — só roda se a chave estiver configurada)
  const resendKey = process.env.RESEND_API_KEY;
  const emailDestino = process.env.PEDIDOS_EMAIL_DESTINO || "leonardocerettasilveira@gmail.com";
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.PEDIDOS_EMAIL_REMETENTE || "Portal Lupo <onboarding@resend.dev>",
        to: emailDestino,
        subject: `Novo pedido — ${payload.cliente.nome} (${totalPecas} peça${totalPecas === 1 ? "" : "s"})`,
        text: montarResumoTexto(payload, totalPecas),
      });
    } catch (e) {
      // não falha a requisição por causa do e-mail — o pedido já foi salvo no banco
      console.error("Erro ao enviar e-mail via Resend:", e);
    }
  } else {
    console.warn("RESEND_API_KEY não configurada — e-mail do pedido não foi enviado (pedido salvo normalmente).");
  }

  return NextResponse.json({ ok: true });
}
