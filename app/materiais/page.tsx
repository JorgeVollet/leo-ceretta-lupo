"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase, type Material } from "@/lib/supabase";

const CHAVE_LIBERADO = "materiais_liberado";

export default function MateriaisPage() {
  const [liberado, setLiberado] = useState<boolean | null>(null);
  const [itens, setItens] = useState<Material[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setLiberado(localStorage.getItem(CHAVE_LIBERADO) === "1");
  }, []);

  useEffect(() => {
    if (!liberado) return;
    (async () => {
      if (!supabase) { setCarregando(false); return; }
      const { data } = await supabase
        .from("materiais")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });
      setItens((data as Material[]) || []);
      setCarregando(false);
    })();
  }, [liberado]);

  if (liberado === null) return null;

  /* ---------- não passou pelo formulário ---------- */
  if (!liberado) {
    return (
      <>
        <Header compact />
        <main className="concreto flex min-h-[70vh] items-center justify-center bg-stone px-5 py-20">
          <div className="max-w-[440px] rounded-lg border border-line bg-white p-8 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 15v2M6 10V7a6 6 0 1 1 12 0v3M5 10h14v11H5z" /></svg>
            </div>
            <h1 className="font-display text-[22px] font-extrabold tracking-tight text-ink">Acesso restrito</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-mute">
              Pra acessar os materiais de divulgação, preencha o formulário rápido na página
              inicial, na seção de serviços.
            </p>
            <Link href="/#materiais" className="mono-label mt-6 inline-block rounded bg-accent px-6 py-3.5 text-paper transition hover:bg-accent-bright">
              Ir para o formulário
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* ---------- lista de links ---------- */
  return (
    <>
      <Header compact />
      <main className="concreto bg-stone pb-20 pt-12">
        <div className="mx-auto max-w-4xl px-5">
          <span className="mono-label text-accent-deep">[ Materiais de divulgação ]</span>
          <h1 className="headline mt-4 text-ink" style={{ fontSize: "clamp(2.2rem,7vw,4.4rem)" }}>
            FOTOS E ARTES OFICIAIS
          </h1>
          <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-ink/80">
            Toque na coleção que você quer. O download abre direto no Dropbox, com todos os
            arquivos em alta qualidade.
          </p>

          {carregando && <p className="mt-10 text-[14px] text-mute">Carregando...</p>}

          {!carregando && itens.length === 0 && (
            <div className="mt-10 rounded-lg border border-line bg-white p-8 text-center shadow-card">
              <p className="font-display text-[17px] font-extrabold text-ink">
                Os materiais estão sendo preparados
              </p>
              <p className="mt-2 text-[14px] text-mute">
                Em breve o conteúdo estará disponível aqui. Qualquer dúvida, me chame no WhatsApp.
              </p>
            </div>
          )}

          {!carregando && itens.length > 0 && (
            <div className="mt-10 space-y-4">
              {itens.map((m) => (
                <a
                  key={m.id}
                  href={m.url || "#"}
                  target="_blank"
                  rel="noopener"
                  className="glow-ring group flex items-center gap-5 rounded-lg border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-accent hover:shadow-lift sm:p-7"
                >
                  <span className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-accent/10 text-accent sm:h-16 sm:w-16">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L6 6l6 4 6-4zM6 14l6 4 6-4-6-4zM2 10l4 2-4 2zM18 12l4-2v4z" />
                    </svg>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[19px] font-extrabold leading-tight tracking-tight text-ink sm:text-[23px]">
                      {m.titulo}
                    </span>
                    <span className="mono-label mt-1.5 block text-accent-deep">
                      Abrir no Dropbox e baixar
                    </span>
                  </span>

                  <span className="flex-none text-accent transition group-hover:translate-x-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </span>
                </a>
              ))}
            </div>
          )}

          <div className="mt-10 rounded-lg border border-accent/25 bg-accent/5 p-5">
            <p className="text-[13px] leading-relaxed text-accent-deep">
              <b>Lembrete:</b> ao publicar nas redes sociais, as imagens geradas por
              inteligência artificial precisam do selo da Meta. O material pode ser usado até
              31/12/2026.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
