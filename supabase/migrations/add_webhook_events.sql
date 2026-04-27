create table if not exists public.webhook_events (
  id bigserial primary key,
  idempotency_key text not null unique,
  event_type text,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_events_processed_at
  on public.webhook_events (processed_at desc);
