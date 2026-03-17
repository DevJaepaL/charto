create table if not exists public.favorite_stocks (
  id bigserial primary key,
  user_key text not null,
  user_name text,
  symbol text not null,
  isin text not null,
  name text not null,
  market text not null check (market in ('KOSPI', 'KOSDAQ', 'KONEX')),
  created_at timestamptz not null default now()
);

create unique index if not exists favorite_stocks_user_key_symbol_idx
  on public.favorite_stocks (user_key, symbol);

create index if not exists favorite_stocks_user_key_created_at_idx
  on public.favorite_stocks (user_key, created_at desc);

