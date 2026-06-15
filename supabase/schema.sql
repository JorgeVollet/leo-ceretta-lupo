-- ============================================================
-- Portal Lupo — schema do Supabase
-- Rode isto no SQL Editor do Supabase (uma vez).
-- ============================================================

-- Catálogos (um por segmento/coleção)
create table if not exists catalogos (
  id           bigint generated always as identity primary key,
  slug         text unique not null,
  titulo       text not null,
  segmento     text not null,
  descricao    text,
  drive_url    text,            -- link do Google Drive pra baixar
  capa_url     text,            -- imagem da capa (Supabase Storage ou URL)
  navegavel    boolean default false,  -- true = tem produtos cadastrados
  ordem        int default 0,
  ativo        boolean default true,
  criado_em    timestamptz default now()
);

-- Produtos (item a item, ex.: Cuecas)
create table if not exists produtos (
  id           bigint generated always as identity primary key,
  catalogo_slug text references catalogos(slug) on delete cascade,
  codigo       text not null,
  nome         text not null,
  descricao    text,
  tamanho      text,
  linha        text,            -- ex.: "Lançamento"
  cores        jsonb default '[]'::jsonb,  -- [{cod, nome}]
  img_url      text,            -- foto do produto
  ordem        int default 0,
  criado_em    timestamptz default now()
);

create index if not exists idx_produtos_catalogo on produtos(catalogo_slug);

-- Leitura pública (catálogo é vitrine); escrita só autenticado
alter table catalogos enable row level security;
alter table produtos enable row level security;

create policy "leitura publica catalogos" on catalogos for select using (true);
create policy "leitura publica produtos"  on produtos  for select using (true);
-- (escrita: configure depois conforme o painel de admin do Leonardo)

-- ============================================================
-- Storage: crie um bucket público chamado "catalogos"
-- (Dashboard > Storage > New bucket > public)
-- pra guardar capas e imagens de produtos.
-- ============================================================
