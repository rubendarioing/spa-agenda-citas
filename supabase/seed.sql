insert into public.branches (name, slug, address, timezone, is_active)
values ('Sede Principal', 'sede-principal', 'Dirección por definir', 'America/Bogota', true)
on conflict (slug) do nothing;
