create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text not null,
  city text,
  phone text,
  whatsapp text,
  email text,
  timezone text not null default 'America/Bogota',
  latitude numeric(9,6),
  longitude numeric(9,6),
  google_maps_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branches_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index branches_active_idx on public.branches(is_active);

create trigger branches_set_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

alter table public.branches enable row level security;

revoke all on public.branches from anon, authenticated;
grant select on public.branches to anon, authenticated;
grant insert, update on public.branches to authenticated;

create policy branches_select_public_active
on public.branches
for select
to anon, authenticated
using (is_active);

create policy branches_select_staff
on public.branches
for select
to authenticated
using ((select public.is_staff()));

create policy branches_write_manager
on public.branches
for all
to authenticated
using ((select public.is_manager()))
with check ((select public.is_manager()));
