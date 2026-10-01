# Spa / Nail Salon PWA — Database Schema

> ⚠️ **DOCUMENTO SUPERADO PARCIALMENTE — REFERENCIA HISTÓRICA**
>
> Este documento corresponde a la propuesta de base de datos **previa a la auditoría especializada**.
>
> La arquitectura aprobada y vigente para implementación se encuentra en:
>
> `04_DATABASE_ARCHITECTURE_APPROVED.md`
>
> Para cualquier decisión relacionada con:
>
> - PostgreSQL;
> - Supabase;
> - tablas;
> - columnas;
> - relaciones;
> - constraints;
> - índices;
> - RLS;
> - SECURITY DEFINER;
> - grants;
> - RPC;
> - motor de disponibilidad;
> - reservas;
> - concurrencia;
> - prevención de doble reserva;
> - seguridad;
> - transacciones;
> - reprogramaciones;
> - cancelaciones;
> - estados;
> - Outbox;
> - idempotencia;
> - Realtime;
> - migraciones;
> - testing SQL;
>
> **`04_DATABASE_ARCHITECTURE_APPROVED.md` prevalece sobre este documento.**
>
> No implementar ninguna decisión de este archivo que contradiga la arquitectura aprobada.
>
> Este documento se conserva para:
>
> - trazabilidad;
> - historial de diseño;
> - comprender decisiones previas;
> - comparar cambios realizados durante la auditoría.
>
> No debe considerarse la especificación final de base de datos.

---

# 1. Objetivos del modelo

La base de datos debe garantizar:

1. integridad de reservas;
2. prevención real de doble reserva;
3. cálculo seguro de disponibilidad;
4. historial consistente;
5. aislamiento de datos privados;
6. autorización mediante RLS;
7. trazabilidad;
8. compatibilidad con Supabase;
9. compatibilidad con Realtime;
10. compatibilidad con patrón Outbox;
11. soporte de múltiples servicios por cita;
12. soporte de varios especialistas;
13. soporte futuro de múltiples sedes;
14. soporte de zona horaria;
15. escalabilidad razonable.

La base de datos debe considerarse la última línea de defensa.

No depender exclusivamente del frontend para:

- precios;
- duración;
- disponibilidad;
- autorización;
- prevención de solapamientos;
- estados de cita;
- integridad relacional.

---

# 2. Convenciones

## 2.1 Idioma

Nombres técnicos:

```text
English
```

Interfaz:

```text
Spanish
```

Base de datos:

```text
snake_case
```

---

## 2.2 IDs

Usar:

```sql
uuid
```

Default:

```sql
gen_random_uuid()
```

Excepto:

```text
profiles.id
```

que referencia directamente:

```text
auth.users.id
```

---

## 2.3 Timestamps

Usar:

```sql
timestamptz
```

para fechas con instante real.

Usar:

```sql
date
time
```

solo donde realmente representen calendario local sin instante absoluto.

Zona horaria inicial:

```text
America/Bogota
```

---

# 3. Extensiones necesarias

```sql
create extension if not exists pgcrypto;
create extension if not exists btree_gist;
```

Validar en Supabase que ambas estén disponibles.

---

# 4. ENUMS

Se recomienda evaluar si usar `enum` PostgreSQL o `text + check`.

Para estados de dominio muy estables, se propone `enum`.

---

## 4.1 user_role

```sql
create type user_role as enum (
  'admin',
  'manager',
  'employee'
);
```

---

## 4.2 appointment_status

```sql
create type appointment_status as enum (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);
```

---

## 4.3 appointment_source

```sql
create type appointment_source as enum (
  'website',
  'admin',
  'phone',
  'whatsapp',
  'walk_in'
);
```

---

## 4.4 notification_status

```sql
create type notification_status as enum (
  'pending',
  'processing',
  'sent',
  'failed'
);
```

---

## 4.5 notification_channel

```sql
create type notification_channel as enum (
  'push',
  'email',
  'whatsapp'
);
```

---

# 5. Helper functions

## 5.1 set_updated_at()

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

Aplicar a tablas que tengan:

```text
updated_at
```

---

# 6. profiles

Representa usuarios internos autenticados.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text not null,

  role user_role not null default 'employee',

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Trigger:

```sql
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();
```

---

# 7. Authorization helpers

Estas funciones deben usar:

```text
security definer
stable
set search_path = public
```

y no depender solamente de:

```text
auth.role() = authenticated
```

---

## 7.1 is_staff()

Retorna `true` si:

- existe `profiles.id = auth.uid()`;
- `is_active = true`;
- role está en `admin`, `manager`, `employee`.

---

## 7.2 is_admin()

Retorna `true` únicamente para:

```text
admin
```

activo.

---

## 7.3 is_manager()

Debe retornar `true` para:

```text
manager
```

activo.

Decidir si admin debe considerarse manager implícitamente.

Recomendación:

```text
admin también satisface operaciones de manager
```

---

## 7.4 is_employee()

Retorna `true` cuando el perfil corresponde a un empleado activo.

---

## 7.5 current_employee_id()

Retorna el registro de:

```text
employees.id
```

asociado al:

```text
auth.uid()
```

actual.

Debe retornar `null` si no existe asociación.

---

# 8. branches

Aunque inicialmente exista una sola sede, modelarla desde MVP.

```sql
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
```

Índices:

```sql
create index branches_active_idx
on public.branches(is_active);
```

---

# 9. service_categories

```sql
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  slug text not null unique,

  description text,

  sort_order integer not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint service_categories_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
```

Índice:

```sql
create index service_categories_active_sort_idx
on public.service_categories(is_active, sort_order);
```

---

# 10. services

```sql
create table public.services (
  id uuid primary key default gen_random_uuid(),

  category_id uuid not null
    references public.service_categories(id),

  name text not null,

  slug text not null unique,

  description text,

  price numeric(12,2) not null,

  duration_minutes integer not null,

  buffer_minutes integer not null default 0,

  image_url text,

  sort_order integer not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint services_price_nonnegative
    check (price >= 0),

  constraint services_duration_positive
    check (duration_minutes > 0),

  constraint services_buffer_nonnegative
    check (buffer_minutes >= 0),

  constraint services_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
```

Índices:

```sql
create index services_category_idx
on public.services(category_id);

create index services_active_sort_idx
on public.services(is_active, sort_order);
```

---

# 11. employees

```sql
create table public.employees (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid unique
    references public.profiles(id)
    on delete set null,

  branch_id uuid not null
    references public.branches(id),

  first_name text not null,

  last_name text not null,

  bio text,

  photo_url text,

  phone text,

  commission_percent numeric(5,2),

  is_bookable boolean not null default true,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint employees_commission_range
    check (
      commission_percent is null
      or commission_percent between 0 and 100
    )
);
```

Índices:

```sql
create index employees_branch_idx
on public.employees(branch_id);

create index employees_active_bookable_idx
on public.employees(is_active, is_bookable);
```

---

# 12. employee_services

Relación N entre especialistas y servicios.

```sql
create table public.employee_services (
  employee_id uuid not null
    references public.employees(id)
    on delete cascade,

  service_id uuid not null
    references public.services(id)
    on delete cascade,

  custom_price numeric(12,2),

  custom_duration_minutes integer,

  created_at timestamptz not null default now(),

  primary key(employee_id, service_id),

  constraint employee_services_custom_price
    check (
      custom_price is null
      or custom_price >= 0
    ),

  constraint employee_services_custom_duration
    check (
      custom_duration_minutes is null
      or custom_duration_minutes > 0
    )
);
```

Índice:

```sql
create index employee_services_service_idx
on public.employee_services(service_id);
```

---

# 13. employee_work_hours

Un empleado puede tener múltiples franjas por día.

Ejemplo:

```text
09:00–13:00
14:00–18:00
```

```sql
create table public.employee_work_hours (
  id uuid primary key default gen_random_uuid(),

  employee_id uuid not null
    references public.employees(id)
    on delete cascade,

  day_of_week smallint not null,

  start_time time not null,

  end_time time not null,

  created_at timestamptz not null default now(),

  constraint employee_work_hours_day_range
    check (day_of_week between 1 and 7),

  constraint employee_work_hours_valid_time
    check (start_time < end_time)
);
```

Índice:

```sql
create index employee_work_hours_lookup_idx
on public.employee_work_hours(employee_id, day_of_week);
```

La aplicación debe impedir franjas recurrentes solapadas.

Validar si conviene hacerlo mediante:

- trigger;
- exclusion constraint sobre representación artificial;
- validación RPC administrativa.

La IA de base de datos debe recomendar la opción más robusta.

---

# 14. employee_breaks

Pausas recurrentes.

```sql
create table public.employee_breaks (
  id uuid primary key default gen_random_uuid(),

  employee_id uuid not null
    references public.employees(id)
    on delete cascade,

  day_of_week smallint not null,

  start_time time not null,

  end_time time not null,

  label text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint employee_breaks_day_range
    check (day_of_week between 1 and 7),

  constraint employee_breaks_valid_time
    check (start_time < end_time)
);
```

Índice:

```sql
create index employee_breaks_lookup_idx
on public.employee_breaks(employee_id, day_of_week, is_active);
```

---

# 15. employee_time_off

Ausencias puntuales.

```sql
create table public.employee_time_off (
  id uuid primary key default gen_random_uuid(),

  employee_id uuid not null
    references public.employees(id)
    on delete cascade,

  start_at timestamptz not null,

  end_at timestamptz not null,

  reason text,

  created_at timestamptz not null default now(),

  constraint employee_time_off_valid_range
    check (start_at < end_at)
);
```

Índice:

```sql
create index employee_time_off_lookup_idx
on public.employee_time_off(employee_id, start_at, end_at);
```

---

# 16. customers

```sql
create table public.customers (
  id uuid primary key default gen_random_uuid(),

  full_name text not null,

  phone text not null,

  email text,

  notes text,

  privacy_consent_at timestamptz,

  privacy_consent_version text,

  marketing_consent boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Índices:

```sql
create index customers_phone_idx
on public.customers(phone);

create index customers_email_lower_idx
on public.customers(lower(email));

create index customers_name_lower_idx
on public.customers(lower(full_name));
```

No hacer `phone unique` inicialmente.

Razones:

- teléfonos compartidos;
- errores de digitación;
- familiares;
- cambios de teléfono.

La lógica pública puede intentar deduplicación conservadora, pero un visitante anónimo nunca debe poder sobrescribir arbitrariamente un cliente existente.

---

# 17. appointments

```sql
create table public.appointments (
  id uuid primary key default gen_random_uuid(),

  public_reference text not null unique,

  branch_id uuid not null
    references public.branches(id),

  customer_id uuid not null
    references public.customers(id),

  employee_id uuid not null
    references public.employees(id),

  start_at timestamptz not null,

  end_at timestamptz not null,

  status appointment_status not null default 'pending',

  total_amount numeric(12,2) not null default 0,

  customer_notes text,

  internal_notes text,

  source appointment_source not null default 'website',

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  cancelled_at timestamptz,

  constraint appointments_time_valid
    check (start_at < end_at),

  constraint appointments_total_nonnegative
    check (total_amount >= 0),

  constraint appointments_cancelled_at_consistency
    check (
      status = 'cancelled'
      or cancelled_at is null
    )
);
```

Índices:

```sql
create index appointments_employee_start_idx
on public.appointments(employee_id, start_at);

create index appointments_branch_start_idx
on public.appointments(branch_id, start_at);

create index appointments_customer_idx
on public.appointments(customer_id);

create index appointments_status_idx
on public.appointments(status);

create index appointments_public_reference_idx
on public.appointments(public_reference);
```

---

# 18. Protección anti-solapamiento

Regla central.

```sql
alter table public.appointments
add constraint appointments_employee_no_overlap
exclude using gist (
  employee_id with =,
  tstzrange(start_at, end_at, '[)') with &&
)
where (
  status in (
    'pending',
    'confirmed',
    'in_progress'
  )
);
```

Interpretación:

```text
[)
```

significa:

- inicio incluido;
- fin excluido.

Por tanto:

```text
10:00–11:00
11:00–12:00
```

NO se consideran solapadas.

---

# 19. Estados que bloquean agenda

Inicialmente:

```text
pending
confirmed
in_progress
```

bloquean horario.

No bloquean:

```text
completed
cancelled
no_show
```

La IA especializada debe validar si:

```text
pending
```

debe reservar el slot inmediatamente.

Recomendación inicial:

sí, porque una reserva pública creada exitosamente debe conservar el espacio.

Si en el futuro se introduce pago previo con expiración, deberá reconsiderarse.

---

# 20. appointment_services

Snapshot histórico.

```sql
create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),

  appointment_id uuid not null
    references public.appointments(id)
    on delete cascade,

  service_id uuid not null
    references public.services(id),

  service_name text not null,

  duration_minutes integer not null,

  unit_price numeric(12,2) not null,

  quantity integer not null default 1,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),

  constraint appointment_services_duration_positive
    check (duration_minutes > 0),

  constraint appointment_services_price_nonnegative
    check (unit_price >= 0),

  constraint appointment_services_quantity_positive
    check (quantity > 0)
);
```

Índice:

```sql
create index appointment_services_appointment_idx
on public.appointment_services(appointment_id);
```

---

# 21. appointment_status_history

```sql
create table public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),

  appointment_id uuid not null
    references public.appointments(id)
    on delete cascade,

  from_status appointment_status,

  to_status appointment_status not null,

  changed_by uuid
    references public.profiles(id)
    on delete set null,

  notes text,

  created_at timestamptz not null default now()
);
```

Índice:

```sql
create index appointment_status_history_appointment_idx
on public.appointment_status_history(
  appointment_id,
  created_at
);
```

---

# 22. business_settings

Inicialmente singleton.

```sql
create table public.business_settings (
  id uuid primary key default gen_random_uuid(),

  business_name text not null,

  timezone text not null default 'America/Bogota',

  currency char(3) not null default 'COP',

  phone text,

  whatsapp text,

  email text,

  address text,

  booking_slot_interval_minutes integer not null default 15,

  minimum_booking_notice_minutes integer not null default 60,

  maximum_booking_days_ahead integer not null default 60,

  cancellation_notice_minutes integer not null default 120,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint business_settings_slot_interval_positive
    check (booking_slot_interval_minutes > 0),

  constraint business_settings_minimum_notice_nonnegative
    check (minimum_booking_notice_minutes >= 0),

  constraint business_settings_maximum_days_positive
    check (maximum_booking_days_ahead > 0),

  constraint business_settings_cancellation_notice_nonnegative
    check (cancellation_notice_minutes >= 0)
);
```

La IA debe evaluar si:

- usar singleton mediante constraint;
- usar tabla key/value;
- preparar `branch_settings`.

Recomendación MVP:

un único registro.

---

# 23. push_subscriptions

```sql
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),

  employee_id uuid not null
    references public.employees(id)
    on delete cascade,

  token text not null unique,

  provider text not null default 'fcm',

  device_label text,

  is_active boolean not null default true,

  last_seen_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Índice:

```sql
create index push_subscriptions_employee_active_idx
on public.push_subscriptions(employee_id, is_active);
```

---

# 24. notification_outbox

```sql
create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),

  event_type text not null,

  aggregate_type text not null,

  aggregate_id uuid not null,

  recipient_type text not null,

  recipient_id uuid,

  channel notification_channel not null,

  payload jsonb not null,

  status notification_status not null default 'pending',

  attempt_count integer not null default 0,

  next_attempt_at timestamptz,

  created_at timestamptz not null default now(),

  processed_at timestamptz,

  last_error text,

  constraint notification_outbox_attempt_nonnegative
    check (attempt_count >= 0)
);
```

Índices:

```sql
create index notification_outbox_pending_idx
on public.notification_outbox(status, next_attempt_at);

create index notification_outbox_aggregate_idx
on public.notification_outbox(
  aggregate_type,
  aggregate_id
);
```

---

# 25. notification_deliveries

```sql
create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),

  outbox_id uuid not null
    references public.notification_outbox(id)
    on delete cascade,

  provider text not null,

  provider_message_id text,

  status text not null,

  response_code text,

  error_message text,

  created_at timestamptz not null default now()
);
```

Índice:

```sql
create index notification_deliveries_outbox_idx
on public.notification_deliveries(outbox_id);
```

---

# 26. gallery_items

```sql
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),

  image_url text not null,

  alt_text text not null,

  caption text,

  sort_order integer not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

# 27. testimonials

```sql
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),

  customer_name text not null,

  content text not null,

  rating smallint,

  sort_order integer not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint testimonials_rating_range
    check (
      rating is null
      or rating between 1 and 5
    )
);
```

---

# 28. RLS — principios generales

Todas las tablas deben tener:

```sql
alter table ... enable row level security;
```

No asumir que:

```text
authenticated = autorizado
```

---

# 29. Matriz de acceso

## Público anon

Puede leer únicamente:

```text
branches activas
service_categories activas
services activos
employees activos y bookable mediante vista/RPC segura
gallery_items activos
testimonials activos
```

No puede leer directamente:

```text
profiles
customers
appointments
appointment_services
appointment_status_history
push_subscriptions
notification_outbox
notification_deliveries
employee phone privado
commission_percent
```

---

# 30. Employee

Puede leer:

- su perfil;
- sus citas;
- datos del cliente asociados a sus citas;
- sus servicios;
- sus horarios;
- sus bloqueos;
- sus propias push subscriptions.

Debe poder actualizar únicamente operaciones expresamente permitidas.

Ejemplo:

- cambiar `in_progress`;
- cambiar `completed`;
- marcar `no_show`.

No permitir cambios arbitrarios a:

- precio;
- empleado;
- cliente;
- horarios;
- comisión.

Estos deben pasar por operación controlada.

---

# 31. Manager

Puede administrar:

- citas;
- clientes;
- servicios;
- categorías;
- empleados;
- horarios;
- bloqueos;
- galería.

No puede modificar roles administrativos salvo decisión explícita.

---

# 32. Admin

Puede hacer todo lo permitido al manager y además:

- gestionar profiles;
- modificar roles;
- configuración sensible.

---

# 33. Exposición pública de employees

No permitir:

```sql
select *
```

anónimo sobre `employees`.

Opciones aceptables:

## Opción A

Vista segura:

```text
public_employees
```

que expone únicamente:

```text
id
first_name
last_name
bio
photo_url
branch_id
is_bookable
```

## Opción B

Grants por columna.

Recomendación:

usar una vista pública segura o RPC para reducir riesgos.

La IA especialista debe validar cuál es mejor con Supabase/RLS.

---

# 34. RPC get_booking_availability

Contrato lógico.

Entrada:

```json
{
  "service_ids": [
    "uuid"
  ],
  "employee_id": null,
  "date": "2026-10-03"
}
```

Salida:

```json
{
  "ok": true,
  "duration_minutes": 90,
  "slots": [
    {
      "employee_id": "uuid",
      "employee_name": "Laura",
      "start_at": "2026-10-03T09:00:00-05:00",
      "end_at": "2026-10-03T10:30:00-05:00"
    }
  ]
}
```

---

# 35. get_booking_availability — reglas

Debe:

1. rechazar lista vacía de servicios;
2. validar UUIDs;
3. validar servicios activos;
4. validar categorías si aplica;
5. encontrar empleados capaces de ejecutar TODOS los servicios;
6. filtrar empleados activos;
7. filtrar `is_bookable = true`;
8. si se selecciona empleado, validar compatibilidad;
9. usar `custom_duration_minutes` cuando exista;
10. usar `duration_minutes` estándar en caso contrario;
11. sumar buffers;
12. obtener zona horaria del negocio/sede;
13. obtener día local correcto;
14. leer franjas laborales;
15. restar descansos;
16. restar `employee_time_off`;
17. restar citas bloqueantes;
18. generar candidatos según `booking_slot_interval_minutes`;
19. comprobar que la duración completa cabe;
20. respetar `minimum_booking_notice_minutes`;
21. respetar `maximum_booking_days_ahead`;
22. devolver slots ordenados;
23. no exponer datos privados.

---

# 36. Duración de múltiples servicios

Decisión MVP:

Todos los servicios de una misma reserva son realizados por:

```text
un único empleado
```

Por tanto:

```text
duration_total =
sum(service_duration)
+
sum(service_buffer)
```

Si en el futuro un combo requiere diferentes especialistas, deberá cambiar el modelo.

Ese escenario está fuera del MVP.

---

# 37. Buffer

Definir claramente semántica.

Recomendación:

```text
buffer_minutes
```

se consume al final del servicio antes de permitir siguiente cita.

Ejemplo:

```text
Servicio: 60 min
Buffer:   10 min

Reserva ocupa:
10:00–11:10
```

La IA especializada debe validar si conviene separar:

```text
buffer_before_minutes
buffer_after_minutes
```

Para MVP se prefiere un único `buffer_minutes`.

---

# 38. RPC create_public_booking

Entrada lógica:

```json
{
  "service_ids": [
    "uuid"
  ],
  "employee_id": "uuid",
  "start_at": "2026-10-03T14:00:00-05:00",

  "customer": {
    "full_name": "Maria Gomez",
    "phone": "+573001234567",
    "email": "maria@example.com",
    "notes": ""
  },

  "privacy_consent": true,
  "privacy_consent_version": "2026-10",

  "website": ""
}
```

`website` = honeypot.

---

# 39. create_public_booking — salida

Éxito:

```json
{
  "ok": true,
  "reference": "SN-8Q7K2M",
  "status": "pending"
}
```

Errores:

```json
{
  "ok": false,
  "code": "slot_no_longer_available"
}
```

---

# 40. Códigos de error públicos

Definir mínimo:

```text
validation_error
consent_required
service_not_found
employee_not_found
employee_not_available
employee_incompatible
date_not_allowed
slot_not_available
slot_no_longer_available
rate_limited
duplicate_request
booking_failed
```

Nunca devolver detalles SQL.

---

# 41. create_public_booking — reglas

Debe ejecutarse de manera transaccional.

Secuencia:

1. validar honeypot;
2. validar consentimiento;
3. validar longitudes;
4. validar teléfono;
5. validar email si existe;
6. rate limit;
7. cargar servicios desde DB;
8. validar activos;
9. cargar empleado;
10. validar activo/bookable;
11. validar que presta todos los servicios;
12. calcular precio real;
13. calcular duración real;
14. calcular buffer real;
15. construir `end_at`;
16. validar zona horaria;
17. validar jornada;
18. validar pausas;
19. validar time_off;
20. validar restricciones de negocio;
21. comprobar disponibilidad;
22. encontrar o crear cliente;
23. generar `public_reference`;
24. insertar cita;
25. dejar que exclusion constraint sea defensa final;
26. insertar appointment_services snapshots;
27. insertar status history;
28. insertar eventos en notification_outbox;
29. commit;
30. devolver únicamente reference/status.

---

# 42. Customer matching

No permitir que usuario anónimo modifique libremente clientes existentes.

Estrategia MVP:

Buscar coincidencia conservadora.

Posibles criterios:

```text
normalized phone
lower(email)
```

Si existe:

- reutilizar ID;
- no sobrescribir datos sensibles automáticamente.

Si no:

- crear nuevo cliente.

La IA especialista debe revisar riesgos de colisiones y privacidad.

---

# 43. Normalización teléfono

Evaluar función:

```text
normalize_phone()
```

Idealmente almacenar formato E.164.

Ejemplo Colombia:

```text
+573001234567
```

No codificar reglas exclusivamente colombianas si pueden evitarse.

---

# 44. public_reference

No usar UUID como referencia visible.

Generar código:

```text
SN-8Q7K2M
```

Requisitos:

- suficiente entropía;
- único;
- no secuencial;
- amigable;
- indexado.

La base debe manejar colisión mediante retry controlado.

---

# 45. Seguridad de consulta de reserva pública

Ruta frontend:

```text
/reserva/:reference
```

No debe permitir enumeración sencilla.

La lectura pública debe exponer únicamente:

- reference;
- servicios;
- especialista visible;
- fecha;
- hora;
- duración;
- monto;
- ubicación;
- estado seguro.

Nunca:

- customer_id;
- email;
- teléfono;
- notas internas;
- UUID internos innecesarios.

Preferir RPC:

```text
get_public_booking_summary(reference)
```

en lugar de SELECT público sobre `appointments`.

---

# 46. RPC get_public_booking_summary

Entrada:

```text
public_reference
```

Salida limitada.

Debe tener protección razonable contra abuso.

La IA debe evaluar si además de `reference` conviene exigir:

- token adicional;
- teléfono parcial;
- signed token.

Para MVP puede bastar una referencia de alta entropía, pero debe documentarse el riesgo.

---

# 47. Reserva administrativa

No permitir que admin cree una cita mediante inserts manuales dispersos desde React.

Crear función controlada:

```text
create_staff_booking
```

Puede compartir lógica interna con:

```text
create_public_booking
```

pero permitir:

- source configurable;
- cliente existente;
- notas internas;
- estado inicial autorizado.

Siempre aplicar anti-overlap.

---

# 48. Reprogramación

Crear operación:

```text
reschedule_appointment
```

Debe:

1. validar permisos;
2. validar cita;
3. validar nuevo horario;
4. validar jornadas;
5. validar disponibilidad;
6. actualizar `start_at/end_at`;
7. registrar historial;
8. generar evento outbox;
9. respetar exclusion constraint.

No hacer:

```text
update appointments
```

directamente desde UI para esta operación crítica.

---

# 49. Cambio de estado

Crear operación:

```text
change_appointment_status
```

Validar transiciones.

Matriz inicial recomendada:

```text
pending -> confirmed
pending -> cancelled

confirmed -> in_progress
confirmed -> cancelled
confirmed -> no_show

in_progress -> completed
in_progress -> cancelled

completed -> sin transición normal
cancelled -> sin transición normal
no_show -> sin transición normal
```

La IA de base de datos debe revisar si conviene permitir recuperación administrativa.

---

# 50. Cancelación

Debe:

- cambiar estado;
- registrar `cancelled_at`;
- crear historial;
- generar outbox;
- liberar inmediatamente el slot.

Como el exclusion constraint solo incluye estados bloqueantes, una cita cancelada deja de bloquear.

---

# 51. notification_outbox — eventos

Iniciales:

```text
appointment.created
appointment.confirmed
appointment.rescheduled
appointment.cancelled
appointment.reminder
appointment.completed
```

No todos necesitan todos los canales.

---

# 52. Outbox idempotency

La IA especialista debe evaluar agregar:

```text
deduplication_key
```

unique.

Recomendación:

sí para eventos donde puede ocurrir reintento.

Ejemplo:

```text
appointment.created:{appointment_id}:push:{employee_id}
```

Esto evita notificaciones duplicadas.

---

# 53. Retry

Estrategia sugerida:

```text
attempt 1 -> inmediato
attempt 2 -> +1 minuto
attempt 3 -> +5 minutos
attempt 4 -> +15 minutos
attempt 5 -> failed definitivo
```

Debe poder configurarse en capa de procesamiento.

No bloquear reservas por fallo de proveedor externo.

---

# 54. Realtime

No depende de la tabla outbox.

Cuando una cita cambia:

```text
appointments
```

puede emitir Broadcast/Reatime para dashboards autorizados.

RLS / Realtime Authorization debe revisarse.

Employee debe recibir únicamente eventos permitidos.

---

# 55. Índices mínimos

Revisar al menos:

```text
appointments(employee_id, start_at)
appointments(branch_id, start_at)
appointments(customer_id)
appointments(status)

employee_work_hours(employee_id, day_of_week)
employee_breaks(employee_id, day_of_week)
employee_time_off(employee_id, start_at, end_at)

employee_services(employee_id, service_id)

services(category_id, is_active)

notification_outbox(status, next_attempt_at)

push_subscriptions(employee_id, is_active)
```

Usar `EXPLAIN ANALYZE` cuando existan datos realistas.

---

# 56. Soft delete

En tablas de catálogo:

```text
is_active
```

Preferir desactivación.

No borrar físicamente:

- empleados históricos;
- servicios usados en citas;
- clientes;
- citas.

Las tablas de relación pueden permitir delete cuando sea seguro.

---

# 57. ON DELETE strategy

Revisar cuidadosamente.

Recomendación:

```text
profiles -> employee profile_id:
ON DELETE SET NULL

employee -> employee_services:
ON DELETE CASCADE

employee -> work_hours:
ON DELETE CASCADE

appointment -> appointment_services:
ON DELETE CASCADE

appointment -> status_history:
ON DELETE CASCADE
```

Pero en producción:

```text
appointments
customers
employees
services
```

idealmente no se eliminan físicamente.

---

# 58. Auditoría

Tabla futura recomendada:

```text
audit_log
```

Campos:

```text
id
actor_profile_id
action
entity_type
entity_id
old_data jsonb
new_data jsonb
ip_metadata opcional
created_at
```

No necesaria para Sprint 1, pero arquitectura debe permitirla.

---

# 59. Seed de desarrollo

Mínimo:

```text
1 branch
5 categories
10 services
3 employees
employee_services
work_hours
breaks
business_settings
gallery demo
testimonials demo
```

No insertar datos personales reales.

---

# 60. RLS tests

Archivo:

```text
supabase/tests/rls_tests.sql
```

---

# 61. Tests como anon

Validar:

```text
puede leer catálogo público seguro
no puede leer customer
no puede leer appointments
no puede leer profiles
no puede leer push subscriptions
no puede escribir tablas
puede ejecutar RPC públicas permitidas
```

---

# 62. Authenticated sin profile

Debe comportarse como usuario sin privilegios administrativos.

No debe:

```text
leer clientes
leer agenda
modificar catálogo
```

---

# 63. Employee

Validar:

- solo citas propias;
- solo clientes asociados a citas propias;
- no puede cambiar comisión;
- no puede cambiar precios;
- no puede ver citas de otros empleados;
- puede registrar token Push propio;
- puede cambiar únicamente estados autorizados.

---

# 64. Manager

Validar CRUD operativo permitido.

No administrar roles.

---

# 65. Admin

Validar:

- profiles;
- roles;
- catálogo;
- empleados;
- citas;
- settings.

---

# 66. Tests disponibilidad

Casos obligatorios:

```text
horario normal
fuera de jornada
día sin jornada
break
time_off parcial
time_off día completo
cita existente
cita cancelada
servicio 30 min
servicio 90 min
múltiples servicios
buffer
employee custom duration
employee incompatible
employee inactive
employee not bookable
service inactive
minimum notice
maximum horizon
cambio de fecha
cambio de timezone
```

---

# 67. Tests concurrencia

Ejecutar dos transacciones concurrentes:

```text
same employee
same interval
```

Resultado:

```text
1 success
1 rejected
```

Nunca:

```text
2 success
```

---

# 68. Tests create_public_booking

Mínimo:

```text
success
honeypot
consent false
invalid phone
invalid email
empty services
inactive service
invalid employee
incompatible employee
outside schedule
inside break
inside time_off
slot occupied
duplicate/concurrent slot
valid multiple services
price manipulation irrelevant
duration manipulation irrelevant
notification outbox created
snapshot created
history created
```

---

# 69. Tests cancelación

Después de cancelar:

```text
slot vuelve a estar disponible
```

---

# 70. Tests reprogramación

Validar:

```text
old slot released
new slot occupied
history recorded
outbox created
overlap rejected
```

---

# 71. Tests timezone

Base almacena:

```text
timestamptz
```

Disponibilidad se interpreta usando:

```text
business_settings.timezone
```

Para Colombia:

```text
America/Bogota
```

No usar:

```text
UTC-5
```

hardcoded.

---

# 72. Migraciones propuestas

Orden inicial:

```text
0001_extensions_and_helpers
0002_profiles_and_auth_helpers
0003_branches
0004_service_categories
0005_services
0006_employees
0007_employee_services
0008_employee_work_hours
0009_employee_breaks
0010_employee_time_off
0011_customers
0012_business_settings
0013_appointments
0014_appointments_overlap_constraint
0015_appointment_services
0016_appointment_status_history
0017_booking_availability_rpc
0018_create_public_booking_rpc
0019_public_booking_summary_rpc
0020_staff_booking_operations
0021_push_subscriptions
0022_notification_outbox
0023_notification_deliveries
0024_gallery_items
0025_testimonials
0026_storage_policies
0027_realtime_configuration
```

Los nombres reales deben llevar timestamp generado por Supabase CLI.

---

# 73. Regla de migraciones

Cada migración debe incluir cuando aplique:

- tabla;
- constraints;
- índices;
- trigger;
- RLS;
- grants;
- comments;
- función asociada.

No dejar seguridad para una migración futura si eso crea una ventana con tabla accesible.

---

# 74. Security Definer

Toda función `security definer` debe:

```text
set search_path = public
```

y evitar SQL dinámico inseguro.

Revocar permisos por defecto:

```sql
revoke all on function ... from public;
```

Después otorgar explícitamente:

```text
anon
authenticated
```

solo cuando corresponda.

---

# 75. RPC pública y service_role

La RPC pública debe ejecutar con privilegios suficientes mediante una función controlada.

Nunca introducir:

```text
service_role
```

en React.

---

# 76. Datos sensibles en errores

Nunca retornar:

- SQLSTATE sin traducir;
- query;
- constraint names;
- stacktrace;
- UUIDs internos innecesarios;
- información de otros clientes.

---

# 77. Rate limiting

PostgreSQL por sí solo puede hacer un control básico.

La IA debe evaluar estrategia.

Posibles alternativas:

1. tabla `booking_rate_limits`;
2. consultar reservas recientes por contacto normalizado;
3. Edge Function + Turnstile;
4. infraestructura externa.

MVP recomendado:

- honeypot;
- límite razonable por teléfono/email;
- posteriormente Turnstile si hay abuso.

---

# 78. Privacidad

Datos personales:

```text
customer.full_name
phone
email
notes
```

deben quedar protegidos mediante RLS.

No enviar PII a:

```text
Analytics
logs públicos
URLs
public_reference
Push payload excesivo
```

Push para empleado puede contener información operativa mínima.

---

# 79. Public Push payload

Evitar información excesiva.

Aceptable:

```text
Nueva cita
María G.
Manicure Spa
4:00 PM
```

Evitar:

```text
teléfono completo
email
notas privadas
```

---

# 80. Revisión especializada requerida

La revisión especializada ya fue realizada.

Su resultado aprobado se encuentra en:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

Este documento `03_DATABASE_SCHEMA.md` no debe utilizarse para reemplazar las decisiones finales de aquella revisión.

---

# 81. Criterio de implementación posterior a la revisión

Para implementar cualquier migración, función, política o contrato de base de datos:

1. consultar primero `04_DATABASE_ARCHITECTURE_APPROVED.md`;
2. utilizar este archivo únicamente como contexto histórico;
3. no recuperar decisiones rechazadas durante la auditoría;
4. no fusionar ambas propuestas silenciosamente;
5. si falta una decisión en `04`, reportarla antes de asumir que la de `03` sigue vigente.

---

# 82. Regla final

La prioridad de la base de datos es:

```text
integridad
>
seguridad
>
concurrencia
>
correctitud
>
performance
>
comodidad de implementación
```

Nunca invertir este orden para simplificar frontend.

Y, para implementación:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
>
03_DATABASE_SCHEMA.md
```
