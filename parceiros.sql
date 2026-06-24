-- ============================================================
-- Cole este SQL no Supabase Dashboard → SQL Editor e execute.
-- ============================================================

-- TABELA: parceiros
create table if not exists public.parceiros (
  id          uuid        primary key default gen_random_uuid(),
  nome        text        not null,
  categoria   text        not null
              check (categoria in ('saude','alimentacao','auto','financeiro','educacao','lazer','outros')),
  descricao   text,
  logo_emoji  text        not null default '🏪',
  cidade      text        not null default 'Salvador, BA',
  ativo       boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- TABELA: beneficios_parceiros
create table if not exists public.beneficios_parceiros (
  id            uuid        primary key default gen_random_uuid(),
  parceiro_id   uuid        not null references public.parceiros(id) on delete cascade,
  titulo        text        not null,
  descricao     text,
  desconto_pct  integer     check (desconto_pct between 0 and 100),
  cupom         text,
  tier_minimo   text        not null default 'bronze'
                            check (tier_minimo in ('bronze', 'prata', 'ouro')),
  ativo         boolean     not null default true,
  validade      date,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.parceiros           enable row level security;
alter table public.beneficios_parceiros enable row level security;

-- Qualquer usuário autenticado vê parceiros/benefícios ativos
create policy "membros veem parceiros ativos"
  on public.parceiros for select
  to authenticated
  using (ativo = true);

create policy "membros veem beneficios ativos"
  on public.beneficios_parceiros for select
  to authenticated
  using (ativo = true);

-- Admin gerencia tudo (inclui inativos)
create policy "admin gerencia parceiros"
  on public.parceiros for all
  to authenticated
  using     (auth.email() = 'vini@admin.com')
  with check (auth.email() = 'vini@admin.com');

create policy "admin gerencia beneficios_parceiros"
  on public.beneficios_parceiros for all
  to authenticated
  using     (auth.email() = 'vini@admin.com')
  with check (auth.email() = 'vini@admin.com');
