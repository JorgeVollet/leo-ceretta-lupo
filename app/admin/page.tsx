"use client";
import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabaseBrowser, type Material } from "@/lib/supabase";

export default function AdminMateriais() {
  const [itens, setItens] = useState<Material[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [link, setLink] = useState("");
  const [nome, setNome] = useState("");
  const [buscandoNome, setBuscandoNome] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!supabaseBrowser) return setCarregando(false);
    const { data } = await supabaseBrowser
      .from("materiais").select("*")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false });
    setItens((data as Material[]) || []);
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // ao colar/sair do campo, busca o nome da pasta sozinho
  async function buscarNome(url: string) {
    if (!url.trim() || !/dropbox\.com/i.test(url)) return;
    setBuscandoNome(true);
    try {
      const r = await fetch("/api/dropbox-nome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const { nome: encontrado } = await r.json();
      if (encontrado) setNome(encontrado);
    } catch {
      /* silencioso — o campo continua editável */
    } finally {
      setBuscandoNome(false);
    }
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setMsg("");
    const url = link.trim();
    if (!url) return setErro("Cole o link do Dropbox.");
    if (!/^https?:\/\//i.test(url)) return setErro("O link precisa começar com https://");
    if (!supabaseBrowser) return setErro("Supabase não configurado.");

    setSalvando(true);
    const titulo = nome.trim() || "Materiais de Divulgação";
    const { error } = await supabaseBrowser.from("materiais").insert({
      titulo,
      url,
      ordem: itens.length + 1,
      ativo: true,
    });
    setSalvando(false);

    if (error) return setErro("Não consegui salvar. Tente de novo.");
    setLink(""); setNome(""); setMsg("Link adicionado.");
    carregar();
    setTimeout(() => setMsg(""), 2500);
  }

  async function alternarAtivo(m: Material) {
    if (!supabaseBrowser) return;
    await supabaseBrowser.from("materiais").update({ ativo: !m.ativo }).eq("id", m.id);
    carregar();
  }

  async function renomear(m: Material) {
    const novo = prompt("Nome que aparece no site:", m.titulo);
    if (novo === null || !supabaseBrowser) return;
    await supabaseBrowser.from("materiais").update({ titulo: novo.trim() || m.titulo }).eq("id", m.id);
    carregar();
  }

  async function excluir(m: Material) {
    if (!supabaseBrowser) return;
    if (!confirm(`Remover "${m.titulo}" da página?`)) return;
    await supabaseBrowser.from("materiais").delete().eq("id", m.id);
    carregar();
  }

  const inputCls =
    "w-full rounded border border-line bg-white px-3.5 py-3 text-[14px] outline-none transition placeholder:text-ink/35 focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink">
          Materiais de divulgação
        </h1>
        <p className="mt-1 text-[14px] text-mute">
          Cole o link do Dropbox. O nome da coleção é preenchido sozinho e vira um botão na
          página dos clientes.
        </p>
      </div>

      {/* ---------- ADICIONAR LINK ---------- */}
      <form onSubmit={adicionar} className="mb-8 rounded-lg border border-line bg-white p-6 shadow-card">
        <label className="mb-1.5 block font-display text-[13.5px] font-extrabold tracking-tight text-ink">
          Link do Dropbox
        </label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onBlur={(e) => buscarNome(e.target.value)}
          onPaste={(e) => {
            const t = e.clipboardData.getData("text");
            setTimeout(() => buscarNome(t), 60);
          }}
          placeholder="https://www.dropbox.com/..."
          className={inputCls}
        />

        <div className="mt-4">
          <label className="mb-1.5 flex items-center gap-2 font-display text-[13.5px] font-extrabold tracking-tight text-ink">
            Nome que aparece no site
            {buscandoNome && <span className="mono-label font-normal text-accent-deep">buscando...</span>}
          </label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Preenchido automaticamente ao colar o link"
            className={inputCls}
          />
          <p className="mt-1.5 text-[12px] text-mute">
            Se o Dropbox não devolver o nome, escreva aqui como quer que apareça.
          </p>
        </div>

        {erro && (
          <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{erro}</p>
        )}
        {msg && (
          <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">{msg}</p>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="mt-5 w-full rounded bg-accent px-6 py-3.5 font-display text-[14.5px] font-bold uppercase tracking-wide text-paper transition hover:bg-accent-bright disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {salvando ? "Salvando..." : "Adicionar link"}
        </button>
      </form>

      {/* ---------- LISTA ---------- */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[17px] font-extrabold tracking-tight text-ink">
          No site ({itens.length})
        </h2>
        <button onClick={carregar} className="mono-label rounded border border-line px-3 py-2 text-ink/60 transition hover:text-ink">
          Atualizar
        </button>
      </div>

      {carregando ? (
        <p className="text-[14px] text-mute">Carregando...</p>
      ) : itens.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center shadow-card">
          <p className="font-display text-[15px] font-extrabold text-ink">Nenhum link ainda</p>
          <p className="mt-1 text-[13px] text-mute">Cole o primeiro link do Dropbox no campo acima.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
          <div className="divide-y divide-line">
            {itens.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className={`flex h-10 w-10 flex-none items-center justify-center rounded ${m.ativo ? "bg-accent/10 text-accent" : "bg-bone text-ink/30"}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L6 6l6 4 6-4zM6 14l6 4 6-4-6-4zM2 10l4 2-4 2zM18 12l4-2v4z" />
                  </svg>
                </span>

                <div className="min-w-[180px] flex-1">
                  <div className="font-display text-[14.5px] font-extrabold tracking-tight text-ink">{m.titulo}</div>
                  <div className="mt-0.5 truncate text-[11.5px] text-mute" title={m.url || ""}>{m.url}</div>
                </div>

                {m.url && (
                  <a href={m.url} target="_blank" rel="noopener"
                     className="mono-label rounded border border-line px-3 py-2 text-ink/60 transition hover:border-accent hover:text-ink">
                    Abrir
                  </a>
                )}
                <button onClick={() => renomear(m)}
                  className="mono-label rounded border border-line px-3 py-2 text-ink/60 transition hover:border-accent hover:text-ink">
                  Renomear
                </button>
                <button
                  onClick={() => alternarAtivo(m)}
                  className={`mono-label rounded px-3 py-2 transition ${
                    m.ativo ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-bone text-ink/50 hover:bg-line"
                  }`}
                >
                  {m.ativo ? "Ativo" : "Oculto"}
                </button>
                <button onClick={() => excluir(m)} aria-label="Excluir"
                  className="rounded p-2 text-ink/35 transition hover:text-red-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
