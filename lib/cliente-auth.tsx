"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { ehAdmin } from "@/lib/admin-emails";

export type PerfilCliente = {
  razao_social: string | null; doc: string | null; email: string | null; status?: string | null;
  // vêm do formulário de cadastro novo (contas antigas têm null)
  nome_contato?: string | null; cargo?: string | null; telefone?: string | null;
};

type Ctx = {
  cliente: PerfilCliente | null;   // perfil do cliente logado (null = não é cliente)
  temSessao: boolean;              // existe algum login ativo (pode ser admin)
  bloqueado: boolean;              // conta existe mas foi bloqueada pelo Leonardo
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<{ ok: boolean; erro?: string }>;
  sair: () => Promise<void>;
  recarregar: () => Promise<void>;
};

const ClienteContext = createContext<Ctx | null>(null);

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<PerfilCliente | null>(null);
  const [temSessao, setTemSessao] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregarPerfil = useCallback(async () => {
    if (!supabaseBrowser) { setCarregando(false); return; }
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    setTemSessao(!!session);
    if (!session) { setCliente(null); setBloqueado(false); setCarregando(false); return; }
    const { data } = await supabaseBrowser
      .from("clientes")
      .select("razao_social,doc,email,status,nome_contato,cargo,telefone")
      .eq("auth_user_id", session.user.id)
      .maybeSingle();
    if (data && (data as PerfilCliente).status === "bloqueado") {
      // conta bloqueada pelo Leonardo — sem acesso ao catálogo
      setCliente(null);
      setBloqueado(true);
    } else if (data) {
      setBloqueado(false);
      setCliente(data as PerfilCliente);
    } else if (ehAdmin(session.user.email)) {
      // Leonardo (login do admin) também acessa o catálogo
      setCliente({ razao_social: "Administrador", doc: null, email: session.user.email ?? null });
    } else {
      setCliente(null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregarPerfil();
    if (!supabaseBrowser) return;
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange(() => { carregarPerfil(); });
    return () => sub.subscription.unsubscribe();
  }, [carregarPerfil]);

  const entrar = useCallback(async (email: string, senha: string) => {
    if (!supabaseBrowser) return { ok: false, erro: "Supabase não configurado" };
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) return { ok: false, erro: error.message };
    await carregarPerfil();
    return { ok: true };
  }, [carregarPerfil]);

  const sair = useCallback(async () => {
    if (supabaseBrowser) await supabaseBrowser.auth.signOut();
    setCliente(null); setTemSessao(false); setBloqueado(false);
  }, []);

  return (
    <ClienteContext.Provider value={{ cliente, temSessao, bloqueado, carregando, entrar, sair, recarregar: carregarPerfil }}>
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  const ctx = useContext(ClienteContext);
  if (!ctx) throw new Error("useCliente precisa estar dentro de <ClienteProvider>");
  return ctx;
}
