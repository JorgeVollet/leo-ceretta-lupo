import { NextResponse } from "next/server";

/**
 * Descobre o nome da pasta/coleção a partir de um link do Dropbox.
 * O Dropbox devolve o nome no <title> e nas meta tags og:title.
 * Se não conseguir ler, devolve vazio e o painel deixa o campo editável.
 */

function limpar(t: string) {
  return t
    .replace(/\s*[-–|]\s*Dropbox\s*$/i, "")
    .replace(/^Dropbox\s*[-–|]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string" || !/dropbox\.com/i.test(url)) {
      return NextResponse.json({ nome: "" });
    }

    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!resp.ok) return NextResponse.json({ nome: "" });
    const html = await resp.text();

    // tenta og:title, depois twitter:title, depois <title>
    const candidatos = [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ];

    for (const re of candidatos) {
      const m = html.match(re);
      if (m?.[1]) {
        const nome = limpar(
          m[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        );
        // ignora títulos genéricos do Dropbox
        if (nome && !/^(dropbox|sign in|entrar|file request)$/i.test(nome)) {
          return NextResponse.json({ nome });
        }
      }
    }

    return NextResponse.json({ nome: "" });
  } catch {
    return NextResponse.json({ nome: "" });
  }
}
