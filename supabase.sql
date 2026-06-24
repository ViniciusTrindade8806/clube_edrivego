-- Clube e-Drive Go — migration
-- Cole este SQL no Supabase Dashboard → SQL Editor e execute.
--
-- ANTES de rodar:
--   No Supabase Dashboard → Authentication → Settings → Email:
--   desative "Confirm email" para que motoristas entrem sem confirmar e-mail (MVP).

-- ============================================================
-- TABELA: membros
-- ============================================================
create table if not exists public.membros (
  id                uuid        primary key references auth.users(id) on delete cascade,
  email             text        unique not null,
  nome              text        not null,
  whatsapp          text,
  tier_id           text        not null default 'bronze'
                                check (tier_id in ('bronze', 'prata', 'ouro')),
  meses_contrato    integer     not null default 0 check (meses_contrato >= 0),
  pontos            integer     not null default 0 check (pontos >= 0),
  codigo_indicacao  text        unique default substr(md5(random()::text), 1, 8),
  created_at        timestamptz not null default now()
);

-- ============================================================
-- RLS — cada membro acessa apenas seus próprios dados
-- ============================================================
alter table public.membros enable row level security;

create policy "membro lê próprio dado"
  on public.membros for select
  using (auth.uid() = id);

create policy "membro insere próprio dado"
  on public.membros for insert
  with check (auth.uid() = id);

create policy "membro atualiza próprio dado"
  on public.membros for update
  using (auth.uid() = id);

-- ============================================================
-- TABELA: indicacoes  (registro de indicações feitas)
-- ============================================================
create table if not exists public.indicacoes (
  id                uuid        primary key default gen_random_uuid(),
  indicador_id      uuid        not null references public.membros(id) on delete cascade,
  indicado_email    text        not null,
  status            text        not null default 'pendente'
                                check (status in ('pendente', 'aprovado', 'rejeitado')),
  pontos_concedidos integer     not null default 0,
  created_at        timestamptz not null default now()
);

alter table public.indicacoes enable row level security;

create policy "indicador lê suas indicações"
  on public.indicacoes for select
  using (auth.uid() = indicador_id);

create policy "indicador insere indicação"
  on public.indicacoes for insert
  with check (auth.uid() = indicador_id);

-- ============================================================
-- FUNÇÃO: atualiza tier automaticamente por meses_contrato
-- ============================================================
create or replace function public.sync_tier()
returns trigger language plpgsql as $$
begin
  new.tier_id :=
    case
      when new.meses_contrato >= 12 then 'ouro'
      when new.meses_contrato >= 4  then 'prata'
      else 'bronze'
    end;
  return new;
end;
$$;

create trigger trg_sync_tier
  before insert or update of meses_contrato
  on public.membros
  for each row execute function public.sync_tier();

-- ============================================================
-- ADMIN: permite que service_role atualize membros
-- (use no painel admin para atualizar meses_contrato)
-- ============================================================
create policy "service_role gerencia membros"
  on public.membros for all
  using (auth.role() = 'service_role');
