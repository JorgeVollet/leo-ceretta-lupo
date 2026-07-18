"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";

/**
 * Casca do painel: cuida do login (Supabase Auth) e desenha a navegação.
 * Enquanto não houver sessão, mostra a tela de entrar.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pronto, setPronto] = useState(false);
  const [logado, setLogado] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    if (!supabaseBrowser) { setPronto(true); return; }
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setLogado(!!data.session);
      setPronto(true);
    });
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_e, session) => {
      setLogado(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!supabaseBrowser) return setErro("Supabase não configurado.");
    setEntrando(true);
    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    setEntrando(false);
    if (error) setErro("E-mail ou senha inválidos.");
  }

  async function sair() {
    await supabaseBrowser?.auth.signOut();
    router.push("/admin");
  }

  if (!pronto) return null;

  /* ---------- TELA DE LOGIN ---------- */
  if (!logado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-5">
        <div className="grain absolute inset-0 opacity-[0.05]" />
        <form
          onSubmit={entrar}
          className="relative z-10 w-full max-w-[400px] rounded-lg border border-white/10 bg-white p-8 shadow-2xl"
        >
          <div className="mb-6">
            <div className="font-display text-[18px] font-extrabold uppercase tracking-tight text-ink">
              Leonardo Ceretta
            </div>
            <div className="mono-label mt-1 text-accent-deep">Painel de administração</div>
          </div>

          <label className="mb-1.5 block font-display text-[13px] font-extrabold tracking-tight text-ink">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded border border-line px-3.5 py-3 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            required
          />

          <label className="mb-1.5 block font-display text-[13px] font-extrabold tracking-tight text-ink">
            Senha
          </label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mb-5 w-full rounded border border-line px-3.5 py-3 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            required
          />

          {erro && (
            <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={entrando}
            className="w-full rounded bg-accent px-6 py-3.5 font-display text-[14px] font-bold uppercase tracking-wide text-paper transition hover:bg-accent-bright disabled:opacity-60"
          >
            {entrando ? "Entrando..." : "Entrar"}
          </button>

          <Link href="/" className="mono-label mt-5 block text-center text-ink/45 transition hover:text-accent-deep">
            ← Voltar ao site
          </Link>
        </form>
      </main>
    );
  }

  /* ---------- PAINEL ---------- */
  const abas = [
    { href: "/admin/faturamento", label: "Faturamento", icon: "M4 5h16v14H4zM8 9h8M8 13h8M8 17h4" },
    { href: "/admin/pedidos", label: "Pedidos", icon: "M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" },
    { href: "/admin", label: "Materiais", icon: "M8 3h8l4 4v14H4V3h4zM15 3v5h5M8 13h8M8 17h5" },
    { href: "/admin/acessos", label: "Acessos", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6" },
  ];

  return (
    <div className="min-h-screen bg-stone">
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="leading-none">
            <div className="font-display text-[15px] font-extrabold uppercase tracking-tight text-ink">
              Leonardo Ceretta
            </div>
            <div className="mono-label mt-1 text-accent-deep">Painel</div>
          </div>

          <nav className="flex items-center gap-1">
            {abas.map((a) => {
              const ativo = pathname === a.href;
              return (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`mono-label inline-flex items-center gap-2 rounded px-3.5 py-2.5 transition ${
                    ativo ? "bg-ink text-paper" : "text-ink/60 hover:bg-bone hover:text-ink"
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={a.icon} />
                  </svg>
                  <span className="hidden sm:inline">{a.label}</span>
                </Link>
              );
            })}
            <button
              onClick={sair}
              className="mono-label ml-1 rounded border border-line px-3.5 py-2.5 text-ink/60 transition hover:border-accent hover:text-ink"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
