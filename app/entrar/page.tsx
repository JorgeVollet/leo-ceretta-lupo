"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabaseBrowser } from "@/lib/supabase";
import { useCliente } from "@/lib/cliente-auth";
import { ehAdmin } from "@/lib/admin-emails";
import { CONTATO } from "@/lib/data";
import {
  CARGOS, cnpjValido, limparCnpj, limparTelefone, mascaraCnpj, mascaraTelefone, telefoneValido,
} from "@/lib/documentos";

type Aba = "entrar" | "criar";

const inputCls =
  "w-full rounded border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelCls = "mono-label mb-1 block text-[11px] text-mute";

// só aceita voltar pra uma página do próprio site (nada de ?redirect=https://outro-site)
function destinoSeguro(v: string | null) {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/catalogos";
}

function EntrarInner() {
  const router = useRouter();
  const params = useSearchParams();
  const destino = destinoSeguro(params.get("redirect"));
  const { cliente, temSessao, bloqueado, carregando, entrar, recarregar } = useCliente();

  const [aba, setAba] = useState<Aba>(params.get("aba") === "criar" ? "criar" : "entrar");

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginErro, setLoginErro] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  // recuperação de senha
  const [mostrarReset, setMostrarReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetOk, setResetOk] = useState(false);
  const [resetErro, setResetErro] = useState("");

  // criar conta
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [razao, setRazao] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [armadilha, setArmadilha] = useState("");   // honeypot: gente não vê, robô preenche
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  // Logado, mas sem cadastro ligado: o login existe e falta só o formulário.
  // Acontece quando o e-mail precisou de confirmação, quando o cadastro falhou
  // depois do signUp, ou com quem travou no primeiro acesso antigo.
  const completar = !carregando && temSessao && !cliente && !bloqueado;
  const [emailSessao, setEmailSessao] = useState("");

  useEffect(() => {
    if (!completar || !supabaseBrowser) return;
    setAba("criar");
    supabaseBrowser.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setEmailSessao(u.email || "");
      // o que a pessoa já tinha digitado no signUp volta preenchido (só pra preencher —
      // o banco não confia em nada disso, valida tudo de novo)
      const m = (u.user_metadata || {}) as Record<string, string | undefined>;
      setNome((v) => v || m.nome_contato || "");
      setCargo((v) => v || m.cargo || "");
      setCnpj((v) => v || mascaraCnpj(m.cnpj || ""));
      setRazao((v) => v || m.razao_social || "");
      setTelefone((v) => v || mascaraTelefone(m.telefone || ""));
    });
  }, [completar]);

  const waAjuda = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(
    "Olá Leonardo! Estou tentando criar meu acesso ao catálogo pelo site e preciso de ajuda."
  )}`;

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseBrowser) return;
    setLoginErro(""); setLoginBusy(true);
    const r = await entrar(loginEmail, loginSenha);
    if (!r.ok) { setLoginBusy(false); setLoginErro(traduz(r.erro)); return; }
    // entrou mas ainda não tem cadastro → fica aqui e mostra o formulário
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    const { data: perfil } = user
      ? await supabaseBrowser.from("clientes").select("id,status").eq("auth_user_id", user.id).maybeSingle()
      : { data: null };
    setLoginBusy(false);
    if (!perfil && !ehAdmin(user?.email)) { setAba("criar"); return; }
    if (perfil?.status === "bloqueado") return;   // fica aqui: o aviso vermelho aparece em cima
    router.push(destino);
  }

  async function enviarReset(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseBrowser) return;
    setResetErro(""); setResetBusy(true);
    const { error } = await supabaseBrowser.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    setResetBusy(false);
    if (error) { setResetErro(traduz(error.message)); return; }
    setResetOk(true);
  }

  // confere no navegador só pra avisar rápido — o banco valida tudo de novo
  function conferir(): string {
    if (nome.trim().length < 3) return "Informe seu nome completo.";
    if (!cargo) return "Escolha seu cargo na empresa.";
    if (!cnpjValido(cnpj)) return "CNPJ inválido. Confira os números.";
    if (razao.trim().length < 3) return "Informe a razão social da empresa.";
    if (!telefoneValido(telefone)) return "Telefone inválido. Use DDD + número.";
    if (!completar) {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Informe um e-mail válido.";
      if (senha.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
    }
    return "";
  }

  async function criarConta(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseBrowser) return;
    if (armadilha) return;                       // robô — não faz nada
    const problema = conferir();
    if (problema) { setErro(problema); return; }
    setErro(""); setAviso(""); setCriando(true);

    const dados = {
      nome_contato: nome.trim(),
      cargo,
      cnpj: limparCnpj(cnpj),
      razao_social: razao.trim(),
      telefone: limparTelefone(telefone),
    };

    if (!completar) {
      const { data: sign, error: e1 } = await supabaseBrowser.auth.signUp({
        email: email.trim(),
        password: senha,
        options: { data: dados },   // só pra preencher o formulário de novo se precisar
      });
      if (e1) { setCriando(false); setErro(traduz(e1.message)); return; }
      if (!sign.session) {
        setCriando(false);
        setAviso("Enviamos um link de confirmação pro seu e-mail. Depois de confirmar, entre com seu e-mail e senha — seus dados vão estar preenchidos, é só concluir.");
        return;
      }
    }

    const { error: e2 } = await supabaseBrowser.rpc("criar_conta_cliente", {
      p_nome: dados.nome_contato,
      p_cargo: dados.cargo,
      p_cnpj: dados.cnpj,
      p_razao: dados.razao_social,
      p_telefone: dados.telefone,
    });
    if (e2) {
      setCriando(false);
      setErro(traduz(e2.message));
      await recarregar();   // o login já existe: a tela vira "complete seu cadastro" pra tentar de novo
      return;
    }
    await recarregar();
    setCriando(false);
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
            Com a conta você faz pedidos pelo site e acompanha seus pedidos. Quem não tem conta
            continua vendo os catálogos em PDF normalmente.
          </p>

          {bloqueado && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-[13px] font-semibold text-red-700">Seu acesso está bloqueado</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-red-700/80">
                Fale com o Leonardo pra liberar.{" "}
                <a href={waAjuda} target="_blank" rel="noopener" className="font-semibold underline underline-offset-2">
                  Chamar no WhatsApp
                </a>
              </p>
            </div>
          )}

          {/* abas */}
          {!completar && (
            <div className="mt-7 inline-flex w-full rounded-lg border border-line bg-white p-1">
              {([["entrar", "Entrar"], ["criar", "Criar conta"]] as const).map(([k, t]) => (
                <button
                  key={k}
                  onClick={() => { setAba(k); setErro(""); setAviso(""); }}
                  className={`mono-label flex-1 rounded px-4 py-2.5 transition ${aba === k ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* ENTRAR */}
          {aba === "entrar" && !completar && (
            <>
              <form onSubmit={fazerLogin} className="mt-6 space-y-4">
                <div>
                  <label className={labelCls}>E-mail</label>
                  <input type="email" required autoComplete="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Senha</label>
                  <input type="password" required autoComplete="current-password" value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} className={inputCls} />
                </div>
                {loginErro && <p className="text-[12.5px] text-red-600">{loginErro}</p>}
                <button type="submit" disabled={loginBusy} className="mono-label w-full rounded bg-ink px-4 py-3.5 text-paper transition hover:bg-accent disabled:opacity-60">
                  {loginBusy ? "Entrando..." : "Entrar"}
                </button>
                <button
                  type="button"
                  onClick={() => { setMostrarReset(true); setResetOk(false); setResetErro(""); if (!resetEmail) setResetEmail(loginEmail); }}
                  className="mono-label w-full text-center text-[12px] text-mute underline underline-offset-2 hover:text-ink"
                >
                  Esqueci minha senha
                </button>
                <p className="text-center text-[12.5px] text-mute">
                  Primeira vez aqui?{" "}
                  <button type="button" onClick={() => setAba("criar")} className="font-semibold text-accent-deep underline underline-offset-2">
                    Criar minha conta
                  </button>
                </p>
              </form>

              {mostrarReset && (
                <div className="mt-5 rounded-lg border border-line bg-bone p-4">
                  {resetOk ? (
                    <>
                      <p className="text-[13px] font-semibold text-ink">Link enviado</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-mute">
                        Se existir uma conta com esse e-mail, o link pra criar uma senha nova chegou na
                        caixa de entrada. Confira também o spam.
                      </p>
                    </>
                  ) : (
                    <form onSubmit={enviarReset} className="space-y-3">
                      <p className="text-[13px] font-semibold text-ink">Criar uma senha nova</p>
                      <p className="text-[12.5px] leading-relaxed text-mute">
                        Digite o e-mail da conta. A gente manda um link pra você mesmo escolher a senha —
                        ninguém precisa te passar senha por WhatsApp.
                      </p>
                      <input
                        type="email" required value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="seu@email.com" className={inputCls}
                      />
                      {resetErro && <p className="text-[12.5px] text-red-600">{resetErro}</p>}
                      <div className="flex gap-2">
                        <button type="submit" disabled={resetBusy} className="mono-label flex-1 rounded bg-accent px-4 py-2.5 text-paper transition hover:bg-accent-bright disabled:opacity-60">
                          {resetBusy ? "Enviando..." : "Enviar link"}
                        </button>
                        <button type="button" onClick={() => setMostrarReset(false)} className="mono-label rounded border border-line bg-white px-4 py-2.5 text-ink/60 transition hover:text-ink">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          )}

          {/* CRIAR CONTA (ou completar o cadastro de quem já tem login) */}
          {(aba === "criar" || completar) && !bloqueado && (
            <form onSubmit={criarConta} className="mt-6 space-y-4" noValidate>
              {completar ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="mono-label text-amber-700">Falta só completar seu cadastro</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-mute">
                    Você já entrou{emailSessao ? <> como <b className="text-ink">{emailSessao}</b></> : null}.
                    Preencha os dados da empresa pra liberar o catálogo.
                  </p>
                </div>
              ) : (
                <p className="text-[12.5px] leading-relaxed text-mute">
                  Preencha seus dados e os da empresa. O acesso ao catálogo e aos pedidos pelo site é
                  liberado na hora.
                </p>
              )}

              <div>
                <label className={labelCls}>Seu nome</label>
                <input type="text" autoComplete="name" maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cargo na empresa</label>
                <select value={cargo} onChange={(e) => setCargo(e.target.value)} className={inputCls}>
                  <option value="">Escolha...</option>
                  {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>CNPJ</label>
                <input
                  type="text" inputMode="text" autoComplete="off" value={cnpj}
                  onChange={(e) => setCnpj(mascaraCnpj(e.target.value))}
                  placeholder="00.000.000/0000-00" className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Razão social</label>
                <input type="text" autoComplete="organization" maxLength={200} value={razao} onChange={(e) => setRazao(e.target.value)} className={inputCls} />
              </div>
              {!completar && (
                <div>
                  <label className={labelCls}>E-mail</label>
                  <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Telefone / WhatsApp</label>
                <input
                  type="tel" inputMode="numeric" autoComplete="tel" value={telefone}
                  onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                  placeholder="(55) 99999-9999" className={inputCls}
                />
              </div>
              {!completar && (
                <div>
                  <label className={labelCls}>Crie uma senha (mín. 6)</label>
                  <input type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} className={inputCls} />
                </div>
              )}

              {/* honeypot: escondido de gente, robô preenche e o envio é ignorado */}
              <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
                <label>Site<input type="text" tabIndex={-1} autoComplete="off" value={armadilha} onChange={(e) => setArmadilha(e.target.value)} /></label>
              </div>

              {erro && <p className="text-[12.5px] text-red-600">{erro}</p>}
              {aviso && <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-[12.5px] leading-relaxed text-emerald-800">{aviso}</p>}

              <button type="submit" disabled={criando} className="mono-label w-full rounded bg-accent px-4 py-3.5 text-paper transition hover:bg-accent-bright disabled:opacity-60">
                {criando ? "Criando..." : completar ? "Concluir cadastro" : "Criar conta e entrar"}
              </button>

              {!completar && (
                <p className="text-center text-[12.5px] text-mute">
                  Já tem conta?{" "}
                  <button type="button" onClick={() => setAba("entrar")} className="font-semibold text-accent-deep underline underline-offset-2">
                    Entrar
                  </button>
                </p>
              )}
              <p className="text-center text-[12px] text-mute">
                Dificuldade pra criar a conta?{" "}
                <a href={waAjuda} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-ink">
                  Fale com o Leonardo
                </a>
              </p>
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

function traduz(msg?: string) {
  const m = (msg || "").toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Esse e-mail já tem conta. Entre pela aba Entrar.";
  if (m.includes("já tem cadastro")) return "Essa conta já tem cadastro. Entre pela aba Entrar.";
  if (m.includes("cnpj inválido")) return "CNPJ inválido. Confira os números.";
  if (m.includes("telefone inválido")) return "Telefone inválido. Use DDD + número.";
  if (m.includes("cargo inválido")) return "Escolha seu cargo na empresa.";
  if (m.includes("informe")) return msg!.charAt(0).toUpperCase() + msg!.slice(1) + ".";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail pelo link que enviamos e tente de novo.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas seguidas. Espere uns minutos e tente de novo.";
  if (m.includes("password")) return "Senha inválida (mín. 6 caracteres).";
  if (m.includes("criar_conta_cliente") || m.includes("schema cache")) return "O cadastro está em manutenção. Tente de novo em alguns minutos.";
  return "Algo deu errado. Tente de novo.";
}

export default function EntrarPage() {
  return (
    <Suspense fallback={null}>
      <EntrarInner />
    </Suspense>
  );
}
