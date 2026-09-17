"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabaseBrowser } from "@/lib/supabase";

const inputCls =
  "w-full rounded border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function NovaSenhaPage() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);      // o link de recuperação abriu a sessão?
  const [verificando, setVerificando] = useState(true);
  const [senha, setSenha] = useState("");
  const [repetir, setRepetir] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);

  // O Supabase troca o link por uma sessão temporária assim que a página abre.
  useEffect(() => {
    if (!supabaseBrowser) { setVerificando(false); return; }
    let vivo = true;

    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      if (data.session) setPronto(true);
      setVerificando(false);
    });

    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((evento, sessao) => {
      if (!vivo) return;
      if (evento === "PASSWORD_RECOVERY" || sessao) { setPronto(true); setVerificando(false); }
    });

    return () => { vivo = false; sub.subscription.unsubscribe(); };
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseBrowser) return;
    if (senha.length < 6) { setErro("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (senha !== repetir) { setErro("As duas senhas estão diferentes."); return; }
    setErro(""); setSalvando(true);
    const { error } = await supabaseBrowser.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      setErro(
        error.message.toLowerCase().includes("session")
          ? "O link expirou. Peça um novo em Entrar → Esqueci minha senha."
          : error.message
      );
      return;
    }
    setOk(true);
    setTimeout(() => router.push("/catalogos"), 1600);
  }

  return (
    <>
      <Header compact />
      <main className="bg-paper">
        <div className="mx-auto max-w-md px-5 py-12">
          <span className="mono-label text-accent-deep">Área do cliente</span>
          <h1 className="headline mt-2 text-ink" style={{ fontSize: "clamp(1.9rem,5vw,2.6rem)" }}>
            Criar uma senha nova
          </h1>

          {verificando ? (
            <p className="mt-6 text-[13.5px] text-mute">Verificando o link...</p>
          ) : ok ? (
            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="mono-label text-emerald-700">Senha alterada</p>
              <p className="mt-1 text-[13px] text-mute">Levando você pro catálogo...</p>
            </div>
          ) : !pronto ? (
            <div className="mt-6 rounded-lg border border-line bg-bone p-4">
              <p className="text-[13px] font-semibold text-ink">Link inválido ou expirado</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-mute">
                Abra esta página pelo link que chegou no seu e-mail. Se já passou do prazo, peça um novo
                em Entrar → Esqueci minha senha.
              </p>
              <Link href="/entrar" className="mono-label mt-3 inline-block rounded bg-accent px-4 py-2.5 text-paper transition hover:bg-accent-bright">
                Ir pro login
              </Link>
            </div>
          ) : (
            <form onSubmit={salvar} className="mt-6 space-y-4">
              <p className="text-[13.5px] leading-relaxed text-mute">
                Escolha a senha que você vai usar pra entrar no catálogo. Só você enxerga ela.
              </p>
              <div>
                <label className="mono-label mb-1 block text-[11px] text-mute">Nova senha (mín. 6)</label>
                <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mono-label mb-1 block text-[11px] text-mute">Repita a senha</label>
                <input type="password" required value={repetir} onChange={(e) => setRepetir(e.target.value)} className={inputCls} />
              </div>
              {erro && <p className="text-[12.5px] text-red-600">{erro}</p>}
              <button type="submit" disabled={salvando} className="mono-label w-full rounded bg-accent px-4 py-3.5 text-paper transition hover:bg-accent-bright disabled:opacity-60">
                {salvando ? "Salvando..." : "Salvar e entrar"}
              </button>
            </form>
          )}

          <p className="mt-8 text-center">
            <Link href="/catalogos" className="mono-label text-ink/60 underline underline-offset-2 transition hover:text-accent-deep">
              ← Ver catálogos em PDF
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
