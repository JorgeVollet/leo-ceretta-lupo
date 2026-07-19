"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabaseBrowser } from "@/lib/supabase";
import { useCliente } from "@/lib/cliente-auth";

type Aba = "entrar" | "criar";
const inputCls =
  "w-full rounded border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

function EntrarInner() {
  const router = useRouter();
  const params = useSearchParams();
  const destino = params.get("redirect") || "/catalogos";
  const { entrar, recarregar } = useCliente();

  const [aba, setAba] = useState<Aba>("entrar");

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginErro, setLoginErro] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  // primeiro acesso
  const [termo, setTermo] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [achado, setAchado] = useState<{ razao_social: string; doc: string | null } | null>(null);
  const [passoErro, setPassoErro] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [criando, setCriando] = useState(false);

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErro(""); setLoginBusy(true);
    const r = await entrar(loginEmail, loginSenha);
    setLoginBusy(false);
    if (!r.ok) { setLoginErro(traduz(r.erro)); return; }
    router.push(destino);
  }

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseBrowser) return;
    setPassoErro(""); setAchado(null); setVerificando(true);
    const { data, error } = await supabaseBrowser.rpc("buscar_cliente_autorizado", { termo });
    setVerificando(false);
    if (error) { setPassoErro("Não consegui verificar agora. Tente de novo."); return; }
    const linha = Array.isArray(data) ? data[0] : data;
    if (!linha) {
      setPassoErro("Não encontramos esse CNPJ ou razão social na base do Leonardo. Fale com ele pra liberar seu acesso.");
      return;
    }
    if (linha.ja_cadastrado) {
      setPassoErro("Esse cadastro já tem uma conta. É só entrar com e-mail e senha.");
      setAba("entrar");
      return;
    }
    setAchado({ razao_social: linha.razao_social, doc: linha.doc ?? null });
  }

  async function criarConta(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseBrowser || !achado) return;
    if (novaSenha.length < 6) { setPassoErro("A senha precisa ter pelo menos 6 caracteres."); return; }
    setPassoErro(""); setCriando(true);
    const { data: signData, error: e1 } = await supabaseBrowser.auth.signUp({
      email: novoEmail.trim(),
      password: novaSenha,
    });
    if (e1) { setCriando(false); setPassoErro(traduz(e1.message)); return; }
    if (!signData.session) {
      setCriando(false);
      setPassoErro("Conta criada, mas o e-mail precisa ser confirmado. Peça pro Leonardo desativar a confirmação de e-mail, ou confirme pelo link enviado.");
      return;
    }
    const { data: vinc, error: e2 } = await supabaseBrowser.rpc("vincular_cliente", { termo, p_email: novoEmail.trim() });
    setCriando(false);
    if (e2 || (vinc && vinc.ok === false)) { setPassoErro(traduz(e2?.message) || "Não consegui vincular seu cadastro."); return; }
    await recarregar();
    router.push(destino);
  }

  return (
    <>
      <Header compact />
      <main className="bg-paper">
        <div className="mx-auto max-w-md px-5 py-12">
          <span className="mono-label text-accent-deep">Área do cliente</span>
          <h1 className="headline mt-2 text-ink" style={{ fontSize: "clamp(1.9rem,5vw,2.6rem)" }}>
            Acesso ao catálogo de compra
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-mute">
            O catálogo de seleção de produtos é exclusivo para clientes cadastrados. Quem não tem conta
            continua vendo os catálogos em PDF normalmente.
          </p>

          {/* abas */}
          <div className="mt-7 inline-flex w-full rounded-lg border border-line bg-white p-1">
            {([["entrar", "Entrar"], ["criar", "Primeiro acesso"]] as const).map(([k, t]) => (
              <button
                key={k}
                onClick={() => setAba(k)}
                className={`mono-label flex-1 rounded px-4 py-2.5 transition ${aba === k ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ENTRAR */}
          {aba === "entrar" && (
            <form onSubmit={fazerLogin} className="mt-6 space-y-4">
              <div>
                <label className="mono-label mb-1 block text-[11px] text-mute">E-mail</label>
                <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mono-label mb-1 block text-[11px] text-mute">Senha</label>
                <input type="password" required value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} className={inputCls} />
              </div>
              {loginErro && <p className="text-[12.5px] text-red-600">{loginErro}</p>}
              <button type="submit" disabled={loginBusy} className="mono-label w-full rounded bg-ink px-4 py-3.5 text-paper transition hover:bg-accent disabled:opacity-60">
                {loginBusy ? "Entrando..." : "Entrar"}
              </button>
              <p className="text-center text-[12.5px] text-mute">
                Primeira vez aqui?{" "}
                <button type="button" onClick={() => setAba("criar")} className="font-semibold text-accent-deep underline underline-offset-2">
                  Criar meu acesso
                </button>
              </p>
            </form>
          )}

          {/* PRIMEIRO ACESSO */}
          {aba === "criar" && (
            <div className="mt-6 space-y-4">
              {!achado ? (
                <form onSubmit={verificar} className="space-y-4">
                  <div>
                    <label className="mono-label mb-1 block text-[11px] text-mute">CNPJ ou Razão Social</label>
                    <input
                      type="text"
                      required
                      value={termo}
                      onChange={(e) => setTermo(e.target.value)}
                      placeholder="Ex.: 12.345.678/0001-90  ou  Loja da Ana Ltda"
                      className={inputCls}
                    />
                    <p className="mt-1.5 text-[12px] text-mute">
                      Usamos isso só pra confirmar que você já é cliente do Leonardo. Pode digitar o CNPJ
                      ou o nome da empresa.
                    </p>
                  </div>
                  {passoErro && <p className="text-[12.5px] text-red-600">{passoErro}</p>}
                  <button type="submit" disabled={verificando} className="mono-label w-full rounded bg-ink px-4 py-3.5 text-paper transition hover:bg-accent disabled:opacity-60">
                    {verificando ? "Verificando..." : "Verificar meu cadastro"}
                  </button>
                </form>
              ) : (
                <form onSubmit={criarConta} className="space-y-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="mono-label text-emerald-700">Cadastro encontrado</p>
                    <p className="mt-1 font-display text-[15px] font-extrabold tracking-tight text-ink">{achado.razao_social}</p>
                    {achado.doc && <p className="text-[12.5px] text-mute">Cadastro nº {achado.doc}</p>}
                  </div>
                  <div>
                    <label className="mono-label mb-1 block text-[11px] text-mute">Seu e-mail</label>
                    <input type="email" required value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="mono-label mb-1 block text-[11px] text-mute">Crie uma senha (mín. 6)</label>
                    <input type="password" required value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className={inputCls} />
                  </div>
                  {passoErro && <p className="text-[12.5px] text-red-600">{passoErro}</p>}
                  <button type="submit" disabled={criando} className="mono-label w-full rounded bg-accent px-4 py-3.5 text-paper transition hover:bg-accent-bright disabled:opacity-60">
                    {criando ? "Criando..." : "Criar acesso e entrar"}
                  </button>
                  <button type="button" onClick={() => { setAchado(null); setPassoErro(""); }} className="mono-label w-full text-center text-[12px] text-mute underline underline-offset-2 hover:text-ink">
                    Não é essa empresa? Buscar de novo
                  </button>
                </form>
              )}
            </div>
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

function traduz(msg?: string) {
  const m = (msg || "").toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Esse e-mail já tem conta. Tente entrar.";
  if (m.includes("já tem uma conta")) return "Esse cadastro já tem conta. Faça login.";
  if (m.includes("não encontrado")) return "Cadastro não encontrado na base.";
  if (m.includes("password")) return "Senha inválida (mín. 6 caracteres).";
  return msg || "Algo deu errado. Tente de novo.";
}

export default function EntrarPage() {
  return (
    <Suspense fallback={null}>
      <EntrarInner />
    </Suspense>
  );
}
