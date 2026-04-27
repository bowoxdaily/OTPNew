-- Migration: Add Markup Settings for Admin Profit Management

-- Table untuk menyimpan pengaturan markup per service
create table if not exists public.markup_settings (
  id bigint generated always as identity primary key,
  service_id text, -- null = global markup
  service_name text,
  markup_percentage numeric default 0, -- persentase markup (misal 20 = 20%)
  markup_fixed numeric default 0, -- markup fixed (misal 5000 = Rp 5000)
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_service_markup unique(service_id)
);

-- Create index untuk fast lookup
create index if not exists idx_markup_settings_service_id on public.markup_settings(service_id);
create index if not exists idx_markup_settings_is_active on public.markup_settings(is_active);

-- Trigger untuk update updated_at
create or replace function update_markup_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_markup_settings_updated_at
  before update on public.markup_settings
  for each row
  execute function update_markup_settings_updated_at();

-- Add columns untuk tracking harga di orders table
alter table public.orders
  add column if not exists provider_price numeric,
  add column if not exists markup_amount numeric,
  add column if not exists reseller_price numeric;

-- Update existing orders dengan provider_price = price (migrasi data lama)
update public.orders
set provider_price = price, markup_amount = 0, reseller_price = price
where provider_price is null;

-- Insert global markup default (0% dan 0 Rp = tanpa markup dulu)
insert into public.markup_settings (service_id, service_name, markup_percentage, markup_fixed, is_active)
values (null, 'GLOBAL', 0, 0, true)
on conflict do nothing;
