"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useCliente } from "@/lib/cliente-auth";
import { supabaseBrowser } from "@/lib/supabase";
import { CONTATO } from "@/lib/data";

type Etapa = "carrinho" | "dados" | "enviando" | "sucesso" | "erro";

function montarMensagemWhatsapp(itens: ReturnType<typeof useCart>["itens"], nome: string) {
  const linhas = itens.map(
    (i) => `• ${i.nome} (cód. ${i.codigo}) — Tam. ${i.tamanho} — Cor ${i.cor} — ${i.quantidade}x`
  );
  const cabecalho = nome ? `Olá Leonardo! Sou ${nome} e quero fechar este pedido:` : "Olá Leonardo! Quero fechar este pedido:";
  return `${cabecalho}\n\n${linhas.join("\n")}`;
}

export default function CarrinhoFlutuante() {
  const {
    itens,
    carregado,
    atualizarQuantidade,
    removerItem,
    limparCarrinho,
    totalPecas,
    validacoes,
    podeFinalizarGrade,
  } = useCart();

  const { cliente } = useCliente();
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>("carrinho");
  const [erroMsg, setErroMsg] = useState("");
  const [dados, setDados] = useState({
    nome: "",
    loja: "",
    whatsapp: "",
    email: "",
    cidade: "",
    observacoes: "",
  });

  // pré-preenche com os dados do cliente logado (razão social / e-mail)
  useEffect(() => {
    if (!cliente) return;
    setDados((d) => ({
      ...d,
      nome: d.nome || cliente.razao_social || "",
      loja: d.loja || cliente.razao_social || "",
      email: d.email || cliente.email || "",
    }));
  }, [cliente]);

  if (!carregado || itens.length === 0) return null;

  function fechar() {
    setAberto(false);
    // pequena espera pra não "piscar" a etapa durante a animação de fechar
    setTimeout(() => setEtapa("carrinho"), 300);
  }

  function atualizarCampo(campo: keyof typeof dados, valor: string) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  async function enviarPedido() {
    if (!dados.nome.trim() || !dados.whatsapp.trim()) {
      setErroMsg("Preencha pelo menos o nome e o WhatsApp pra eu conseguir te retornar.");
      return;
    }
    setErroMsg("");
    setEtapa("enviando");
    try {
      const itensParaEnviar = itens.map(
        ({ catalogoSlug, catalogoTitulo, segmento, codigo, nome, tamanho, cor, quantidade }) => ({
          catalogoSlug,
          catalogoTitulo,
          segmento,
          codigo,
          nome,
          tamanho,
          cor,
          quantidade,
        })
      );
      // token do cliente logado — a API só aceita pedido autenticado
      const { data: { session } } = supabaseBrowser
        ? await supabaseBrowser.auth.getSession()
        : { data: { session: null } };
      const resposta = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ cliente: dados, itens: itensParaEnviar }),
      });
      if (resposta.status === 401) {
        setErroMsg("Sua sessão expirou. Entre de novo pra finalizar o pedido.");
        setEtapa("dados");
        return;
      }
      if (!resposta.ok) throw new Error("Falha ao enviar pedido");
      setEtapa("sucesso");
      limparCarrinho();
    } catch {
      setEtapa("erro");
    }
  }

  return (
    <>
      {/* botão flutuante — canto oposto ao do WhatsApp */}
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Ver carrinho"
        className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 rounded-full bg-ink px-4 py-3.5 text-paper shadow-[0_10px_30px_-6px_rgba(14,17,23,0.55)] transition hover:scale-105"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.8h8.2a2 2 0 0 0 2-1.6L21 8H6" />
          <circle cx="9.5" cy="20" r="1.4" />
          <circle cx="17" cy="20" r="1.4" />
        </svg>
        <span className="mono-label text-[12.5px]">{totalPecas} peça{totalPecas === 1 ? "" : "s"}</span>
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-[210] flex justify-end bg-ink/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Carrinho de pedido"
          onClick={fechar}
        >
          <div
            className="flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* cabeçalho */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-[17px] font-extrabold tracking-tight text-ink">
                {etapa === "carrinho" && "Seu pedido"}
                {etapa === "dados" && "Seus dados"}
                {(etapa === "enviando") && "Enviando..."}
                {etapa === "sucesso" && "Pedido enviado"}
                {etapa === "erro" && "Não deu certo"}
              </h2>
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink transition hover:bg-bone"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* ETAPA: carrinho */}
            {etapa === "carrinho" && (
              <>
                <div className="flex-1 divide-y divide-line">
                  {itens.map((i) => (
                    <div key={i.chave} className="flex gap-3 px-5 py-4">
                      <div className="h-16 w-16 flex-none overflow-hidden rounded border border-line bg-bone">
                        {i.img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={i.img} alt={i.nome} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-[13px] font-bold leading-snug text-ink">{i.nome}</div>
                        <div className="mt-0.5 text-[11.5px] text-mute">
                          Tam. {i.tamanho} · Cor {i.cor}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => atualizarQuantidade(i.chave, i.quantidade - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-line text-ink transition hover:border-accent"
                            aria-label="Diminuir"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-[13px] font-semibold text-ink">{i.quantidade}</span>
                          <button
                            type="button"
                            onClick={() => atualizarQuantidade(i.chave, i.quantidade + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-line text-ink transition hover:border-accent"
                            aria-label="Aumentar"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removerItem(i.chave)}
                            className="ml-auto text-[11.5px] text-mute underline underline-offset-2 transition hover:text-ink"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* validação de grade */}
                <div className="space-y-2 border-t border-line bg-bone px-5 py-4">
                  {validacoes.map((v) => (
                    <div key={v.segmento} className="flex items-start gap-2 text-[12px] leading-relaxed">
                      <span className={v.ok ? "text-emerald-600" : "text-amber-600"}>{v.ok ? "✓" : "!"}</span>
                      <span className="text-mute">
                        <strong className="text-ink">{v.segmento}:</strong> {v.totalPecas} peça{v.totalPecas === 1 ? "" : "s"} — {v.descricao}
                        {!v.ok && ` — faltam ${v.faltam} peça${v.faltam === 1 ? "" : "s"} pra fechar a grade`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-line px-5 py-4">
                  <button
                    type="button"
                    disabled={!podeFinalizarGrade}
                    onClick={() => setEtapa("dados")}
                    className="mono-label w-full rounded bg-ink px-4 py-3.5 text-center text-paper transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Finalizar pedido
                  </button>
                  {!podeFinalizarGrade && (
                    <p className="mt-2 text-center text-[11.5px] text-mute">
                      Ajuste as quantidades pra fechar a grade de cada segmento antes de continuar.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ETAPA: dados do cliente */}
            {(etapa === "dados" || etapa === "enviando" || etapa === "erro") && (
              <div className="flex-1 space-y-4 px-5 py-5">
                <div>
                  <label className="mono-label mb-1 block text-[11px] text-mute">Seu nome *</label>
                  <input
                    type="text"
                    value={dados.nome}
                    onChange={(e) => atualizarCampo("nome", e.target.value)}
                    className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] text-ink focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mono-label mb-1 block text-[11px] text-mute">Nome da loja</label>
                  <input
                    type="text"
                    value={dados.loja}
                    onChange={(e) => atualizarCampo("loja", e.target.value)}
                    className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] text-ink focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mono-label mb-1 block text-[11px] text-mute">WhatsApp *</label>
                  <input
                    type="text"
                    value={dados.whatsapp}
                    onChange={(e) => atualizarCampo("whatsapp", e.target.value)}
                    placeholder="(55) 9 9999-9999"
                    className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] text-ink focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mono-label mb-1 block text-[11px] text-mute">Cidade</label>
                  <input
                    type="text"
                    value={dados.cidade}
                    onChange={(e) => atualizarCampo("cidade", e.target.value)}
                    className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] text-ink focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mono-label mb-1 block text-[11px] text-mute">E-mail (opcional)</label>
                  <input
                    type="email"
                    value={dados.email}
                    onChange={(e) => atualizarCampo("email", e.target.value)}
                    className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] text-ink focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mono-label mb-1 block text-[11px] text-mute">Observações (opcional)</label>
                  <textarea
                    value={dados.observacoes}
                    onChange={(e) => atualizarCampo("observacoes", e.target.value)}
                    rows={3}
                    className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] text-ink focus:border-accent focus:outline-none"
                  />
                </div>

                {erroMsg && <p className="text-[12.5px] text-red-600">{erroMsg}</p>}
                {etapa === "erro" && (
                  <p className="text-[12.5px] text-red-600">
                    Não consegui enviar o pedido agora. Pode tentar de novo, ou me chamar direto no WhatsApp com o
                    resumo abaixo.
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEtapa("carrinho")}
                    className="mono-label flex-1 rounded border border-line px-4 py-3 text-center text-ink transition hover:border-accent"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={enviarPedido}
                    disabled={etapa === "enviando"}
                    className="mono-label flex-1 rounded bg-ink px-4 py-3 text-center text-paper transition hover:bg-accent disabled:opacity-60"
                  >
                    {etapa === "enviando" ? "Enviando..." : "Enviar pedido"}
                  </button>
                </div>

                {etapa === "erro" && (
                  <a
                    href={`https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(montarMensagemWhatsapp(itens, dados.nome))}`}
                    target="_blank"
                    rel="noopener"
                    className="mono-label block w-full rounded border border-line px-4 py-3 text-center text-ink transition hover:border-accent"
                  >
                    Enviar resumo pelo WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* ETAPA: sucesso */}
            {etapa === "sucesso" && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <div className="font-display text-[17px] font-extrabold tracking-tight text-ink">Pedido enviado!</div>
                  <p className="mt-2 max-w-[28ch] text-[13px] leading-relaxed text-mute">
                    Recebi seu pedido e vou te chamar no WhatsApp pra confirmar valores e condições.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fechar}
                  className="mono-label mt-2 w-full rounded bg-ink px-4 py-3 text-center text-paper transition hover:bg-accent"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
