import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// null quando não configurado — a camada de dados cai pros arquivos locais
export const supabase = url && key ? createClient(url, key) : null;

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
