import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ehAdmin } from "@/lib/admin-emails";
import { cnpjValido, limparCnpj, telefoneValido } from "@/lib/documentos";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

/**
 * Confere o token do cliente logado e devolve o perfil, o id do login e um client
 * Supabase "como ele" — o pedido é gravado com esse client, então a RLS garante
 * que o pedido fica no nome de quem está logado (ou null se o token for inválido).
 */
async function clienteDoToken(token: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return null;
  const authed = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData } = await authed.auth.getUser();
  if (!userData?.user) return null;
  const { data: perfil } = await authed
    .from("clientes")
    .select("razao_social,doc,status")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();
  const base = { userId: userData.user.id, db: authed };
  if (perfil) {
    const p = perfil as { razao_social: string | null; doc: string | null; status?: string | null };
    if (p.status === "bloqueado") return null;   // conta bloqueada não faz pedido
    return { ...base, razao_social: p.razao_social, doc: p.doc };
  }
  // Leonardo (login do admin) também pode fazer pedido
  if (ehAdmin(userData.user.email)) return { ...base, razao_social: "Administrador", doc: null };
  return null;
}

type ItemPedido = {
  catalogoSlug: string;
  catalogoTitulo: string;
  segmento: string;
  codigo: string;
  nome: string;
  tamanho: string;
  cor: string;
  corCod?: string;   // código da cor escolhida (kits sortidos)
  quantidade: number;
  img?: string;      // miniatura pro painel
};

type PayloadPedido = {
  cliente: {
    nome: string;
    loja?: string;
    whatsapp: string;
    email?: string;
    cidade?: string;
    observacoes?: string;
    cnpj?: string;
    site?: string;   // honeypot: escondido no formulário, só robô preenche
  };
  itens: ItemPedido[];
};

// Limite por IP pra quem manda pedido SEM conta. É só uma primeira barreira
// (cada instância da Vercel tem a sua memória) — o limite que vale de verdade
// está no banco, dentro de registrar_pedido_sem_conta.
const tentativasPorIp = new Map<string, number[]>();
function passouDoLimite(ip: string) {
  const agora = Date.now();
  const recentes = (tentativasPorIp.get(ip) || []).filter((t) => agora - t < 10 * 60_000);
  recentes.push(agora);
  tentativasPorIp.set(ip, recentes);
  if (tentativasPorIp.size > 5000) tentativasPorIp.clear();
  return recentes.length > 6;
}
const emailValido = (v?: string) => !!v && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());

function montarResumoTexto(payload: PayloadPedido, totalPecas: number) {
  const linhas = payload.itens.map(
    (i) =>
      `- ${i.nome} (cód. ${i.codigo}) | ${i.catalogoTitulo} | Tam. ${i.tamanho} | Cor ${i.cor}${i.corCod ? ` (cód. cor ${i.corCod})` : ""} | ${i.quantidade}x`
  );
  return [
    `Novo pedido pelo site — ${payload.cliente.nome}`,
    payload.cliente.loja ? `Loja: ${payload.cliente.loja}` : null,
    payload.cliente.cnpj ? `CNPJ: ${payload.cliente.cnpj}` : null,
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

  // robô preencheu o campo escondido: finge que deu certo e não grava nada
  if (payload?.cliente?.site) return NextResponse.json({ ok: true });

  if (!Array.isArray(payload?.itens) || payload.itens.length === 0 || payload.itens.length > 300) {
    return NextResponse.json({ erro: "Carrinho vazio" }, { status: 400 });
  }

  // 0) quem está logado grava no próprio nome; quem não está, vai pelo pedido sem conta
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;
  const perfil = token ? await clienteDoToken(token) : null;

  if (!perfil) {
    return pedidoSemConta(req, payload);
  }

  if (!payload?.cliente?.nome?.trim() || !payload?.cliente?.whatsapp?.trim()) {
    return NextResponse.json({ erro: "Nome e WhatsApp são obrigatórios" }, { status: 400 });
  }

  const totalPecas = payload.itens.reduce((soma, i) => soma + (Number(i.quantidade) || 0), 0);
  const catalogoSlug = payload.itens[0]?.catalogoSlug ?? "";

  // 1) salva no Supabase — segue funcionando mesmo se o e-mail falhar depois.
  if (supabase) {
    const { error } = await perfil.db.from("pedidos").insert({
      auth_user_id: perfil.userId,   // dono do pedido — aparece em "Meus pedidos" dele
      origem: "conta",
      cliente_cnpj: limparCnpj(payload.cliente.cnpj || "") || perfil.doc || null,
      status: "novo",
      cliente_nome: payload.cliente.nome,
      cliente_loja: payload.cliente.loja || perfil.razao_social || null,
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

  await avisarLeonardo(payload, totalPecas, "");
  return NextResponse.json({ ok: true });
}

/** 2) e-mail pro Leonardo via Resend (opcional — só roda se a chave estiver configurada) */
async function avisarLeonardo(payload: PayloadPedido, totalPecas: number, marca: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const emailDestino = process.env.PEDIDOS_EMAIL_DESTINO || "leonardocerettasilveira@gmail.com";
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.PEDIDOS_EMAIL_REMETENTE || "Portal Lupo <onboarding@resend.dev>",
        to: emailDestino,
        subject: `Novo pedido${marca} — ${payload.cliente.nome} (${totalPecas} peça${totalPecas === 1 ? "" : "s"})`,
        text: montarResumoTexto(payload, totalPecas),
      });
    } catch (e) {
      // não falha a requisição por causa do e-mail — o pedido já foi salvo no banco
      console.error("Erro ao enviar e-mail via Resend:", e);
    }
  } else {
    console.warn("RESEND_API_KEY não configurada — e-mail do pedido não foi enviado (pedido salvo normalmente).");
  }
}

/**
 * Pedido de quem NÃO tem conta: nome, telefone, empresa, CNPJ e e-mail.
 * Porta pública → limite por IP, campos conferidos aqui e de novo no banco
 * (registrar_pedido_sem_conta), erro genérico pra quem insiste.
 */
async function pedidoSemConta(req: Request, payload: PayloadPedido) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "sem-ip";
  if (passouDoLimite(ip)) {
    return NextResponse.json({ erro: "Muitos pedidos seguidos. Espere alguns minutos ou me chame no WhatsApp." }, { status: 429 });
  }

  const c = payload.cliente || ({} as PayloadPedido["cliente"]);
  const faltando: string[] = [];
  if ((c.nome || "").trim().length < 3) faltando.push("nome");
  if (!telefoneValido(c.whatsapp || "")) faltando.push("telefone");
  if ((c.loja || "").trim().length < 3) faltando.push("empresa");
  if (!cnpjValido(c.cnpj || "")) faltando.push("CNPJ");
  if (!emailValido(c.email)) faltando.push("e-mail");
  if (faltando.length) {
    return NextResponse.json({ erro: `Confira: ${faltando.join(", ")}.` }, { status: 400 });
  }
  if (!supabase) {
    return NextResponse.json({ erro: "Não foi possível salvar o pedido" }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("registrar_pedido_sem_conta", {
    p_nome: c.nome,
    p_telefone: c.whatsapp,
    p_empresa: c.loja,
    p_cnpj: c.cnpj,
    p_email: c.email,
    p_cidade: c.cidade || null,
    p_observacoes: c.observacoes || null,
    p_itens: payload.itens,
  });
  if (error) {
    console.error("Pedido sem conta recusado:", error.message);
    if (/muitos pedidos/i.test(error.message)) {
      return NextResponse.json({ erro: "Muitos pedidos seguidos. Espere alguns minutos ou me chame no WhatsApp." }, { status: 429 });
    }
    return NextResponse.json({ erro: "Não foi possível salvar o pedido. Confira os dados e tente de novo." }, { status: 400 });
  }

  const totalPecas = (data as { total_pecas?: number } | null)?.total_pecas
    ?? payload.itens.reduce((soma, i) => soma + (Number(i.quantidade) || 0), 0);
  await avisarLeonardo(payload, totalPecas, " (sem conta)");
  return NextResponse.json({ ok: true });
}
