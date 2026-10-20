import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Sem cache: o Next 14 guarda as respostas do fetch no "Data Cache" e o site continuava
// mostrando catálogo/produto antigo depois de mudar o banco (visto em 20/10/2026).
const semCache: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });

// null quando não configurado — a camada de dados cai pros arquivos locais
export const supabase = url && key ? createClient(url, key, { global: { fetch: semCache } }) : null;

/**
 * Client do navegador COM sessão persistente (usado no painel admin).
 * Mantém o login do Leonardo salvo entre visitas.
 */
export const supabaseBrowser =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export type Material = {
  id: string;
  titulo: string;
  url: string | null;
  ordem: number | null;
  ativo: boolean;
  created_at: string;
};

export type AcessoMaterial = {
  id: string;
  email: string;
  razao_social: string | null;
  cnpj: string | null;
  aceite_termo: boolean;
  origem: string | null;
  created_at: string;
};
