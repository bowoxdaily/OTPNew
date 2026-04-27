create extension if not exists "pgcrypto";

create table if not exists public.users (
  id text primary key default ('user_' || replace(gen_random_uuid()::text, '-', '')),
  username text not null unique,
  name text not null,
  role text not null check (role in ('admin', 'user')) default 'user',
  password_hash text not null,
  balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  user_id text not null references public.users(id) on delete restrict,
  provider_order_id text not null,
  number text not null,
  layanan text not null,
  operator text not null,
  negara text not null,
  price numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
