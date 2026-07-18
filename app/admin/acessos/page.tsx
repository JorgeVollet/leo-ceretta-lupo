"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabaseBrowser, type AcessoMaterial } from "@/lib/supabase";

export default function AdminAcessos() {
  const [itens, setItens] = useState<AcessoMaterial[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    if (!supabaseBrowser) return setCarregando(false);
    const { data } = await supabaseBrowser
      .from("acessos_materiais").select("*")
      .order("created_at", { ascending: false });
    setItens((data as AcessoMaterial[]) || []);
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return itens;
    return itens.filter((i) =>
      [i.email, i.razao_social, i.cnpj].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [itens, busca]);

  const unicos = useMemo(() => new Set(itens.map((i) => i.email)).size, [itens]);
  const doMes = useMemo(() => {
    const agora = new Date();
    return itens.filter((i) => {
      const d = new Date(i.created_at);
      return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
    }).length;
  }, [itens]);

  function baixarCSV() {
    const cab = ["Data", "E-mail", "Razao social", "CNPJ", "Aceitou termo"];
    const linhas = filtrados.map((i) => [
      new Date(i.created_at).toLocaleString("pt-BR"),
      i.email,
      i.razao_social || "",
      i.cnpj || "",
      i.aceite_termo ? "Sim" : "Nao",
    ]);
    const csv = [cab, ...linhas]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `acessos-materiais-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <AdminShell>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink">
            Quem acessou os materiais
          </h1>
          <p className="mt-1 text-[14px] text-mute">
            Registro de quem preencheu o formulário e aceitou o termo.
          </p>
        </div>
        <button
          onClick={baixarCSV}
          className="mono-label inline-flex items-center gap-2 rounded bg-ink px-4 py-2.5 text-paper transition hover:bg-accent"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12M6 12l6 6 6-6M4 21h16" /></svg>
          Baixar CSV
        </button>
      </div>

      {/* números */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { n: itens.length, l: "Acessos no total" },
          { n: unicos, l: "E-mails diferentes" },
          { n: doMes, l: "Neste mês" },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-line bg-white p-4 shadow-card">
            <div className="font-display text-[26px] font-extrabold tracking-tight text-accent-deep">{k.n}</div>
            <div className="mt-0.5 text-[12px] text-mute">{k.l}</div>
          </div>
        ))}
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por e-mail, loja ou CNPJ..."
        className="mb-4 w-full rounded border border-line bg-white px-4 py-3 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
      />

      {carregando ? (
        <p className="text-[14px] text-mute">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center shadow-card">
          <p className="font-display text-[15px] font-extrabold text-ink">Nenhum acesso registrado ainda</p>
          <p className="mt-1 text-[13px] text-mute">Assim que alguém pedir os materiais, aparece aqui.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
          <div className="hidden bg-ink px-4 py-3 text-paper sm:grid sm:grid-cols-[150px_1fr_1fr_140px]">
            <span className="mono-label">Data</span>
            <span className="mono-label">E-mail</span>
            <span className="mono-label">Loja</span>
            <span className="mono-label">CNPJ</span>
          </div>
          <div className="divide-y divide-line">
            {filtrados.map((a) => (
              <div key={a.id} className="grid gap-1 px-4 py-3.5 sm:grid-cols-[150px_1fr_1fr_140px] sm:gap-3">
                <span className="text-[12.5px] text-mute">
                  {new Date(a.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="text-[13.5px] font-semibold text-ink">{a.email}</span>
                <span className="text-[13px] text-mute">{a.razao_social || "—"}</span>
                <span className="text-[13px] text-mute">{a.cnpj || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
