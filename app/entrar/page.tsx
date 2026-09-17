"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabaseBrowser } from "@/lib/supabase";
import { useCliente } from "@/lib/cliente-auth";
import { CONTATO } from "@/lib/data";

type Aba = "entrar" | "criar";
type Achado = {
  razao_social: string;
  doc: string | null;
  confianca: "exato" | "sugestao";
  ja_cadastrado: boolean;
  email_dica: string | null;
};

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

  // recuperação de senha
  const [mostrarReset, setMostrarReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetOk, setResetOk] = useState(false);
  const [resetErro, setResetErro] = useState("");

  // primeiro acesso
  const [termo, setTermo] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [achado, setAchado] = useState<Achado | null>(null);
  const [confirmado, setConfirmado] = useState(false);  // cliente disse "sim, é minha empresa"
  const [passoErro, setPassoErro] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [criando, setCriando] = useState(false);
  // cadastro de cliente que não está na base
  const [falhou, setFalhou] = useState(false);
  const [modoSerial, setModoSerial] = useState(false);
  const [razaoManual, setRazaoManual] = useState("");
  const [cnpjManual, setCnpjManual] = useState("");

  const waCodigo = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(
    "Olá Leonardo! Quero criar meu acesso ao catálogo, mas meu cadastro não apareceu no site. Pode me ajudar?"
  )}`;

  function irPraCadastroNovo(nome: string) {
    setAchado(null);
    setConfirmado(false);
    setPassoErro("");
    setRazaoManual(nome);
    setModoSerial(true);
  }

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErro(""); setLoginBusy(true);
    const r = await entrar(loginEmail, loginSenha);
    setLoginBusy(false);
    if (!r.ok) { setLoginErro(traduz(r.erro)); return; }
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

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseBrowser) return;
    setPassoErro(""); setAchado(null); setConfirmado(false);
    setFalhou(false); setModoSerial(false); setVerificando(true);
    const { data, error } = await supabaseBrowser.rpc("buscar_cliente_autorizado", { termo });
    setVerificando(false);
    if (error) { setPassoErro("Não consegui verificar agora. Tente de novo."); return; }
    const linha = Array.isArray(data) ? data[0] : data;
    if (!linha) {
      const ehCnpj = termo.replace(/\D/g, "").length >= 8;
      setPassoErro(ehCnpj
        ? "Não achamos pelo CNPJ. Tente digitar o NOME da empresa (razão social) — nem todo cadastro tem o CNPJ na nossa base."
        : "Não encontramos esse cadastro na base do Leonardo.");
      if (!ehCnpj) setRazaoManual(termo);
      setFalhou(true);
      return;
    }
    setAchado({
      razao_social: linha.razao_social,
      doc: linha.doc ?? null,
      confianca: linha.confianca === "exato" ? "exato" : "sugestao",
      ja_cadastrado: !!linha.ja_cadastrado,
      email_dica: linha.email_dica ?? null,
    });
  }

  // cadastro livre: cria a conta na hora (o Leonardo revisa depois no painel)
  async function criarLivre(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseBrowser) return;
    if (!razaoManual.trim()) { setPassoErro("Informe a razão social (nome da empresa)."); return; }
    if (novaSenha.length < 6) { setPassoErro("A senha precisa ter pelo menos 6 caracteres."); return; }
    setPassoErro(""); setCriando(true);
    const { data: signData, error: e1 } = await supabaseBrowser.auth.signUp({ email: novoEmail.trim(), password: novaSenha });
    if (e1) { setCriando(false); setPassoErro(traduz(e1.message)); return; }
    if (!signData.session) {
      setCriando(false);
      setPassoErro("Conta criada, mas o e-mail precisa ser confirmado. Peça pro Leonardo desativar a confirmação de e-mail, ou confirme pelo link enviado.");
      return;
    }
    const { data: r, error: e2 } = await supabaseBrowser.rpc("criar_cliente_livre", {
      p_razao: razaoManual.trim(), p_cnpj: cnpjManual.trim() || null, p_email: novoEmail.trim(),
    });
    setCriando(false);
    if (e2 || (r && r.ok === false)) { setPassoErro(traduz(e2?.message) || "Não consegui criar seu acesso."); return; }
    await recarregar();
    router.push(destino);
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
    // vincula pela razão social que o cliente confirmou na tela — não pelo que digitou
    const { data: vinc, error: e2 } = await supabaseBrowser.rpc("vincular_cadastro", {
      p_razao_social: achado.razao_social,
      p_email: novoEmail.trim(),
      // match parecido entra como pendente e aparece no alerta do painel
      p_exato: achado.confianca === "exato",
    });
    setCriando(false);
    if (e2 || (vinc && vinc.ok === false)) { setPassoErro(traduz(e2?.message) || "Não consegui vincular seu cadastro."); return; }
    await recarregar();
    router.push(destino);
  }

  const precisaConfirmar = !!achado && achado.confianca === "sugestao" && !confirmado;
  const cadastroPronto = !!achado && !precisaConfirmar;

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
            <>
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
                    Criar meu acesso
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
                        Digite o e-mail da conta. A gente manda um link pra você mesma escolher a senha —
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

          {/* PRIMEIRO ACESSO */}
          {aba === "criar" && (
            <div className="mt-6 space-y-4">
              {precisaConfirmar && achado ? (
                /* match parecido → confirma antes de qualquer coisa */
                <div className="space-y-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="mono-label text-amber-700">Achamos um cadastro parecido</p>
                    <p className="mt-1 font-display text-[15px] font-extrabold tracking-tight text-ink">{achado.razao_social}</p>
                    {achado.doc && <p className="text-[12.5px] text-mute">Cadastro nº {achado.doc}</p>}
                    <p className="mt-2 text-[12.5px] leading-relaxed text-mute">
                      Não é exatamente o que você digitou. Essa é a sua empresa?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setConfirmado(true); setPassoErro(""); }}
                    className="mono-label w-full rounded bg-accent px-4 py-3.5 text-paper transition hover:bg-accent-bright"
                  >
                    Sim, é a minha empresa
                  </button>
                  <button
                    type="button"
                    onClick={() => irPraCadastroNovo(termo)}
                    className="mono-label w-full rounded border border-line bg-white px-4 py-3 text-ink/70 transition hover:text-ink"
                  >
                    Não é essa — quero cadastrar a minha
                  </button>
                </div>
              ) : cadastroPronto && achado?.ja_cadastrado ? (
                /* esse cadastro já tem login */
                <div className="space-y-4">
                  <div className="rounded-lg border border-line bg-bone p-4">
                    <p className="mono-label text-ink/60">Esse cadastro já tem uma conta</p>
                    <p className="mt-1 font-display text-[15px] font-extrabold tracking-tight text-ink">{achado.razao_social}</p>
                    {achado.email_dica && (
                      <p className="mt-2 text-[12.5px] text-mute">
                        A conta está no e-mail <b className="text-ink">{achado.email_dica}</b>
                      </p>
                    )}
                    <p className="mt-2 text-[12.5px] leading-relaxed text-mute">
                      Se a senha não estiver com você, peça um link pra criar uma nova. O Leonardo não
                      tem como ver senha de ninguém.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAba("entrar"); setMostrarReset(true); setResetOk(false); }}
                    className="mono-label w-full rounded bg-accent px-4 py-3.5 text-paper transition hover:bg-accent-bright"
                  >
                    Criar uma senha nova
                  </button>
                  <button
                    type="button"
                    onClick={() => irPraCadastroNovo(termo)}
                    className="mono-label w-full rounded border border-line bg-white px-4 py-3 text-ink/70 transition hover:text-ink"
                  >
                    Não é a minha empresa — quero cadastrar a minha
                  </button>
                </div>
              ) : cadastroPronto && achado ? (
                /* cadastro confirmado e livre → cria a conta */
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
                  <button type="button" onClick={() => { setAchado(null); setConfirmado(false); setPassoErro(""); }} className="mono-label w-full text-center text-[12px] text-mute underline underline-offset-2 hover:text-ink">
                    Não é essa empresa? Buscar de novo
                  </button>
                </form>
              ) : modoSerial ? (
                /* cliente fora da base → cadastro livre */
                <form onSubmit={criarLivre} className="space-y-4">
                  <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                    <p className="mono-label text-accent-deep">Criar meu acesso</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-mute">
                      É só preencher seus dados — o acesso é liberado na hora. O Leonardo confere o
                      cadastro depois.
                    </p>
                  </div>
                  <div>
                    <label className="mono-label mb-1 block text-[11px] text-mute">Razão social (nome da empresa)</label>
                    <input type="text" required value={razaoManual} onChange={(e) => setRazaoManual(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="mono-label mb-1 block text-[11px] text-mute">CNPJ (opcional)</label>
                    <input type="text" value={cnpjManual} onChange={(e) => setCnpjManual(e.target.value)} className={inputCls} />
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
                    {criando ? "Criando..." : "Criar acesso"}
                  </button>
                  <button type="button" onClick={() => { setModoSerial(false); setPassoErro(""); }} className="mono-label w-full text-center text-[12px] text-mute underline underline-offset-2 hover:text-ink">
                    ← Voltar
                  </button>
                </form>
              ) : (
                /* busca inicial */
                <>
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

                  {falhou && (
                    <div className="rounded-lg border border-line bg-bone p-4">
                      <p className="text-[13px] font-semibold text-ink">Não achou seu cadastro?</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-mute">
                        Sem problema — você pode criar seu acesso agora mesmo. É liberado na hora, e o
                        Leonardo confere seu cadastro depois.
                      </p>
                      <div className="mt-3 flex flex-col gap-2">
                        <button type="button" onClick={() => { setModoSerial(true); setPassoErro(""); }} className="mono-label rounded bg-accent px-4 py-2.5 text-center text-paper transition hover:bg-accent-bright">
                          Criar meu acesso →
                        </button>
                        <a href={waCodigo} target="_blank" rel="noopener" className="mono-label rounded border border-line bg-white px-4 py-2.5 text-center text-ink/70 transition hover:text-ink">
                          Falar com o Leonardo
                        </a>
                      </div>
                    </div>
                  )}
                </>
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
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas seguidas. Espere uns minutos e tente de novo.";
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
