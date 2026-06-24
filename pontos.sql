-- ============================================================
-- Cole este SQL no Supabase Dashboard → SQL Editor e execute.
-- ============================================================

-- TABELA: pontos_transacoes (histórico de movimentações)
create table if not exists public.pontos_transacoes (
  id          uuid        primary key default gen_random_uuid(),
  membro_id   uuid        not null references public.membros(id) on delete cascade,
  valor       integer     not null,
  descricao   text,
  tipo        text        not null default 'manual'
              check (tipo in ('manual', 'indicacao', 'resgate', 'contrato')),
  created_at  timestamptz not null default now()
);

-- TABELA: resgates (pedidos de resgate de recompensas)
create table if not exists public.resgates (
  id           uuid        primary key default gen_random_uuid(),
  membro_id    uuid        not null references public.membros(id) on delete cascade,
  recompensa   text        not null,
  pontos_custo integer     not null,
  status       text        not null default 'pendente'
               check (status in ('pendente', 'aprovado', 'rejeitado')),
  codigo       text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.pontos_transacoes enable row level security;
alter table public.resgates           enable row level security;

-- Membros veem e inserem apenas os próprios registros
create policy "membro le proprias transacoes"
  on public.pontos_transacoes for select
  using (auth.uid() = membro_id);

create policy "membro insere propria transacao"
  on public.pontos_transacoes for insert
  with check (auth.uid() = membro_id);

create policy "membro le proprios resgates"
  on public.resgates for select
  using (auth.uid() = membro_id);

create policy "membro cria resgate"
  on public.resgates for insert
  with check (auth.uid() = membro_id);

-- Admin gerencia tudo
create policy "admin gerencia transacoes"
  on public.pontos_transacoes for all
  to authenticated
  using     (auth.email() = 'vini@admin.com')
  with check (auth.email() = 'vini@admin.com');

create policy "admin gerencia resgates"
  on public.resgates for all
  to authenticated
  using     (auth.email() = 'vini@admin.com')
  with check (auth.email() = 'vini@admin.com');
