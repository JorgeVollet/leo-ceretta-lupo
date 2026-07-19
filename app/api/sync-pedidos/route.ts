import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pedidosDeWorkbook } from "@/lib/parsers";

// precisa de Node (Buffer + xlsx), não pode ser edge
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Recebe um relatório de PEDIDOS (.xls/.xlsx) vindo do Gmail do Leonardo
 * (enviado pelo Google Apps Script) e importa pro Supabase.
 *
 * Segurança:
 *  - header  x-sync-token  precisa bater com a env SYNC_TOKEN
 *  - escreve no Supabase autenticado por login (SYNC_EMAIL/SYNC_PASSWORD),
 *    respeitando o RLS. NÃO usa service_role.
 *
 * Corpo (JSON):  { arquivo: string, base64: string }
 */
export async function POST(req: NextRequest) {
  // 1) autenticação do chamador (Apps Script)
  const token = req.headers.get("x-sync-token");
  if (!process.env.SYNC_TOKEN || token !== process.env.SYNC_TOKEN) {
    return NextResponse.json({ ok: false, erro: "não autorizado" }, { status: 401 });
  }

  // 2) corpo
  let body: { arquivo?: string; base64?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "json inválido" }, { status: 400 });
  }
  const arquivo = body.arquivo || "email";
  if (!body.base64) {
    return NextResponse.json({ ok: false, erro: "sem anexo (base64)" }, { status: 400 });
  }

  // 3) parse do relatório (mesma lógica do painel)
  let pedidos;
  try {
    const buf = Buffer.from(body.base64, "base64");
    pedidos = pedidosDeWorkbook(buf, arquivo);
  } catch (e: any) {
    return NextResponse.json({ ok: false, erro: "falha ao ler a planilha: " + (e?.message || e) }, { status: 422 });
  }
  if (!pedidos.length) {
    return NextResponse.json({ ok: true, arquivo, registros: 0, aviso: "nenhuma linha reconhecida" });
  }

  // 3b) dedup por ordem_venda — alguns relatórios (ex.: ALOCADO) trazem mais de
  // uma linha para a mesma Ordem de Venda, e o upsert não aceita mexer na
  // mesma linha duas vezes dentro do mesmo lote. Fica a última ocorrência.
  {
    const porOrdem = new Map<string, (typeof pedidos)[number]>();
    for (const p of pedidos) porOrdem.set(p.ordem_venda, p);
    pedidos = Array.from(porOrdem.values());
  }

  // 4) Supabase autenticado (sem service_role)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !process.env.SYNC_EMAIL || !process.env.SYNC_PASSWORD) {
    return NextResponse.json(
      {
        ok: false,
        erro: "variáveis do Supabase/login não configuradas",
        debug: {
          temUrl: !!url,
          temAnon: !!anon,
          temEmail: !!process.env.SYNC_EMAIL,
          temPassword: !!process.env.SYNC_PASSWORD,
        },
      },
      { status: 500 }
    );
  }
  const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: eAuth } = await supabase.auth.signInWithPassword({
    email: process.env.SYNC_EMAIL,
    password: process.env.SYNC_PASSWORD,
  });
  if (eAuth) {
    return NextResponse.json({ ok: false, erro: "login no Supabase falhou: " + eAuth.message }, { status: 500 });
  }

  // 5) upsert em lotes (dedup por ordem_venda — reenvio do mesmo relatório não duplica)
  let ok = 0;
  for (let i = 0; i < pedidos.length; i += 400) {
    const lote = pedidos.slice(i, i + 400);
    const { error } = await supabase.from("ordens_venda").upsert(lote, { onConflict: "ordem_venda" });
    if (error) {
      return NextResponse.json({ ok: false, erro: error.message, importados: ok }, { status: 500 });
    }
    ok += lote.length;
  }

  // 6) registra no histórico de importações
  await supabase.from("importacoes").insert({
    tipo: "relatorio",
    arquivo,
    registros: pedidos.length,
    atualizados: ok,
    deposito: pedidos[0]?.deposito ?? null,
    detalhe: "sincronização automática (Gmail)",
  });

  return NextResponse.json({ ok: true, arquivo, registros: ok, deposito: pedidos[0]?.deposito ?? null });
}
