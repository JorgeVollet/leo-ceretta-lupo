# Portal Lupo — Leonardo Ceretta (JV Web Studio)

Site de catálogos da representação Lupo. Fase 1.

## Como rodar localmente (ver o site funcionando)

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`. **Funciona na hora**, com os dados de exemplo já embutidos (catálogo de Cuecas completo + os outros catálogos por capa).

## Stack
- **Next.js 14** (App Router) + **Tailwind CSS**
- **Supabase** (opcional nesta fase — o site já funciona com dados locais em `/data`)
- Deploy: **Vercel**

## Estrutura
- `app/` — páginas (home, segmento, catálogo navegável, produto)
- `components/` — componentes reutilizáveis
- `data/` — dados dos catálogos e produtos (JSON). É daqui que o site lê por padrão.
- `lib/` — conexão Supabase e camada de dados
- `supabase/` — schema SQL pra quando migrar pro banco
- `public/produtos/` — imagens dos produtos extraídos

## Migrar pro Supabase (quando quiser que o Leonardo gerencie sem código)
Veja o arquivo `GUIA-PUBLICACAO.md` na pasta de saída. Resumo: criar projeto no Supabase, rodar `supabase/schema.sql`, popular as tabelas, e setar as variáveis em `.env.local`. O site detecta e passa a ler do banco.

## Publicar (Vercel)
1. Subir este projeto num repositório (GitHub).
2. Importar na Vercel.
3. (Opcional) setar variáveis do Supabase.
4. Deploy. Pronto.
