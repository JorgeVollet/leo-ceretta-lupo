"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase";

export type PerfilCliente = { razao_social: string | null; doc: string | null; email: string | null };

type Ctx = {
  cliente: PerfilCliente | null;   // perfil do cliente logado (null = não é cliente)
  temSessao: boolean;              // existe algum login ativo (pode ser admin)
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<{ ok: boolean; erro?: string }>;
  sair: () => Promise<void>;
  recarregar: () => Promise<void>;
};

const ClienteContext = createContext<Ctx | null>(null);

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<PerfilCliente | null>(null);
  const [temSessao, setTemSessao] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregarPerfil = useCallback(async () => {
    if (!supabaseBrowser) { setCarregando(false); return; }
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    setTemSessao(!!session);
    if (!session) { setCliente(null); setCarregando(false); return; }
    const { data } = await supabaseBrowser
      .from("clientes")
      .select("razao_social,doc,email")
      .eq("auth_user_id", session.user.id)
      .maybeSingle();
    setCliente(data ? (data as PerfilCliente) : null);
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
    setCliente(null); setTemSessao(false);
  }, []);

  return (
    <ClienteContext.Provider value={{ cliente, temSessao, carregando, entrar, sair, recarregar: carregarPerfil }}>
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  const ctx = useContext(ClienteContext);
  if (!ctx) throw new Error("useCliente precisa estar dentro de <ClienteProvider>");
  return ctx;
}
