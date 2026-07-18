"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Modal de acesso aos Materiais de Divulgação.
 * Coleta e-mail, razão social e CNPJ + aceite do termo de uso de imagem.
 * Grava em `acessos_materiais` e libera a subpágina /materiais.
 */

const LIMITE = "31/12/2026";
const CHAVE_LIBERADO = "materiais_liberado";

function formatarCNPJ(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function MateriaisModal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [razao, setRazao] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [aceite, setAceite] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function abrir(e: React.MouseEvent) {
    e.preventDefault();
    // se já liberou antes, vai direto
    if (typeof window !== "undefined" && localStorage.getItem(CHAVE_LIBERADO) === "1") {
      router.push("/materiais");
      return;
    }
    setOpen(true);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return setErro("Informe um e-mail válido.");
    if (!aceite) return setErro("É preciso concordar com o termo para continuar.");

    setEnviando(true);
    try {
      if (supabase) {
        const { error } = await supabase.from("acessos_materiais").insert({
          email: email.trim().toLowerCase(),
          razao_social: razao.trim() || null,
          cnpj: cnpj.trim() || null,
          aceite_termo: true,
          origem: "site",
        });
        if (error) throw error;
      }
      localStorage.setItem(CHAVE_LIBERADO, "1");
      localStorage.setItem("materiais_email", email.trim().toLowerCase());
      setOpen(false);
      router.push("/materiais");
    } catch {
      // não trava o cliente por erro de rede — libera e segue
      localStorage.setItem(CHAVE_LIBERADO, "1");
      setOpen(false);
      router.push("/materiais");
    } finally {
      setEnviando(false);
    }
  }

  const input =
    "w-full rounded border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/35 focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <>
      <button type="button" onClick={abrir} className={className}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[220] flex items-end justify-center bg-ink/75 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Acesso aos materiais de divulgação"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-[600px] overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* cabeçalho */}
            <div className="relative overflow-hidden bg-ink px-6 py-6 text-paper sm:rounded-t-lg">
              <div className="grain absolute inset-0 opacity-[0.06]" />
              <div className="relative z-10">
                <span className="mono-label text-accent-sky">Acesso liberado na hora</span>
                <h3 className="headline mt-2 text-paper" style={{ fontSize: "clamp(1.6rem,5vw,2.3rem)" }}>
                  MATERIAIS DE DIVULGAÇÃO
                </h3>
                <p className="mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-paper/70">
                  Preencha os dados abaixo e concorde com o termo para acessar as fotos e
                  artes oficiais dos produtos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-paper transition hover:bg-white/10"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            <form onSubmit={enviar} className="px-6 py-6">
              {/* 1. dados */}
              <div className="mb-5">
                <label className="mb-1.5 block font-display text-[14px] font-extrabold tracking-tight text-ink">
                  1. E-mail <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@empresa.com.br"
                  className={input}
                  required
                />
              </div>

              <div className="mb-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-display text-[14px] font-extrabold tracking-tight text-ink">
                    2. Razão social / Loja
                  </label>
                  <input
                    type="text"
                    value={razao}
                    onChange={(e) => setRazao(e.target.value)}
                    placeholder="Nome da sua loja"
                    className={input}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-display text-[14px] font-extrabold tracking-tight text-ink">
                    3. CNPJ
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    className={input}
                  />
                </div>
              </div>

              {/* 2. termo */}
              <div className="rounded-lg border border-line bg-bone p-4">
                <p className="font-display text-[14px] font-extrabold leading-snug tracking-tight text-ink">
                  4. Tenho ciência de que a data limite para utilização desse material é {LIMITE}.{" "}
                  <span className="text-red-600">*</span>
                </p>
                <p className="mt-2.5 text-[12.5px] font-semibold leading-relaxed text-ink/80">
                  O material foi produzido com ajuda de IA, portanto, ao ser publicado nas redes
                  sociais, é necessário que as imagens contenham o selo da Meta identificando
                  conteúdos gerados por inteligência artificial.
                </p>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-mute">
                  O material poderá ser veiculado apenas nas mídias e localidades descritas abaixo:
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-mute">
                  <span className="font-semibold text-ink/70">Localidades:</span> Brasil, África do
                  Sul, Arábia Saudita, Argentina, Austrália, Bolívia, Canadá, Chile, Costa Rica,
                  Líbia, Nova Zelândia, El Salvador, Equador, Eslovênia, Estados Unidos, Guatemala,
                  Holanda, Inglaterra, Japão, Paraguai, Peru, Líbano, Portugal, República
                  Dominicana, Suíça, Suriname, Uruguai e Venezuela.
                </p>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-mute">
                  Após o dia {LIMITE}, o material deve ser excluído das mídias indicadas e não mais
                  utilizado, sob pena das medidas cabíveis.
                </p>

                <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded border border-line bg-white p-3 transition hover:border-accent">
                  <input
                    type="checkbox"
                    checked={aceite}
                    onChange={(e) => setAceite(e.target.checked)}
                    className="mt-0.5 h-4 w-4 flex-none accent-[#2563EB]"
                  />
                  <span className="font-display text-[14px] font-extrabold tracking-tight text-ink">
                    Concordo.
                  </span>
                </label>
              </div>

              {erro && (
                <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="shimmer mt-5 w-full rounded bg-accent px-6 py-4 font-display text-[15px] font-bold uppercase tracking-wide text-paper transition hover:bg-accent-bright disabled:opacity-60"
              >
                {enviando ? "Liberando acesso..." : "Acessar materiais →"}
              </button>
              <p className="mt-3 text-center text-[11.5px] text-mute">
                Seus dados são usados apenas para controle de acesso ao material.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
