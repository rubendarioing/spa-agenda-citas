# Spa / Nail Salon PWA — Database Architecture Approved

> **Estado:** APROBADO CON CAMBIOS INCORPORADOS  
> **Uso:** este documento reemplaza las decisiones conflictivas de `03_DATABASE_SCHEMA.md` y debe usarse como fuente de verdad técnica para PostgreSQL/Supabase.
>
> Claude debe leer, en este orden:
> 1. `00_PROJECT_CONTEXT.md`
> 2. `01_TECHNICAL_SPEC.md`
> 3. `02_EXECUTION_PLAN_CLAUDE.md`
> 4. **este documento**
>
> En conflictos sobre base de datos, RLS, concurrencia, reservas, RPC, Outbox o seguridad, **prevalece este documento**.
>
> Este documento no autoriza a construir toda la aplicación de una vez. Debe seguirse el plan paso a paso.

# 1. Principios no negociables

La base de datos debe garantizar integridad, seguridad, concurrencia, aislamiento de PII, autorización server-side, cálculo server-side de precio/duración/disponibilidad, prevención real de doble reserva, transacciones atómicas, Outbox e idempotencia.

Prioridad:

```text
integridad > seguridad > concurrencia > correctitud > performance > comodidad
```

El frontend nunca es frontera de seguridad.

# 2. Convenciones

- IDs: `uuid`, normalmente `gen_random_uuid()`.
- `profiles.id` referencia `auth.users.id`.
- Instantes reales: `timestamptz`.
- Calendario recurrente: `date` / `time`.
- Timezone inicial: `America/Bogota`.
- Timezone canónica para reservas: `branches.timezone`.
- `business_settings.timezone`, si existe, es solo default global/informativo.

# 3. Extensiones

```sql
create extension if not exists pgcrypto;
create extension if not exists btree_gist;
```

`btree_gist` es obligatorio para combinar igualdad de `employee_id` con solapamiento de rangos.

# 4. ENUMS

```sql
create type public.user_role as enum ('admin','manager','employee');
create type public.appointment_status as enum (
  'pending','confirmed','in_progress','completed','cancelled','no_show'
);
create type public.appointment_source as enum (
  'website','admin','phone','whatsapp','walk_in'
);
create type public.notification_channel as enum ('push','email','whatsapp');
create type public.notification_status as enum (
  'pending','processing','sent','failed'
);
```

# 5. set_updated_at

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;
```

# 6. profiles

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**No usar `default 'employee'` en `role`.** Todo rol debe asignarse explícitamente.

# 7. Authorization helpers

Funciones obligatorias:

```text
is_staff()
is_admin()
is_manager()
is_employee()
current_employee_id()
```

Todas:
- `SECURITY DEFINER`
- `STABLE`
- `SET search_path = ''`
- objetos totalmente cualificados
- sin SQL dinámico
- `REVOKE ALL ... FROM PUBLIC`
- `GRANT EXECUTE` solo a quien corresponda.

Ejemplo:

```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active
      and p.role = 'admin'::public.user_role
  );
$$;
```

`is_manager()` debe ser true para `manager` y `admin`.  
`is_employee()` debe representar específicamente rol `employee`.  
`current_employee_id()` se crea **después** de la tabla `employees`.

# 8. branches

Se mantiene el diseño actual. `branches.timezone` es la fuente canónica del motor de reservas.

# 9. service_categories y services

Se mantienen, incluyendo:

```text
price >= 0
duration_minutes > 0
buffer_minutes >= 0
slug unique
```

Compatibilidad MVP:
- dos servicios son compatibles si un mismo empleado puede prestar ambos.
- no crear `service_incompatibilities` salvo que el negocio confirme incompatibilidades explícitas.

# 10. employees

Se mantiene. Employee no puede modificar directamente:

```text
commission_percent
branch_id
profile_id
is_active
```

# 11. employee_services

Se mantiene:

```text
PK(employee_id, service_id)
custom_price >= 0
custom_duration_minutes > 0
```

Employee no puede modificar `custom_price` ni `custom_duration_minutes`.

# 12. employee_work_hours

Debe impedir franjas recurrentes solapadas.

```sql
alter table public.employee_work_hours
add column work_range int4range
generated always as (
  int4range(
    (extract(epoch from start_time) / 60)::integer,
    (extract(epoch from end_time) / 60)::integer,
    '[)'
  )
) stored;
```

```sql
alter table public.employee_work_hours
add constraint employee_work_hours_no_overlap
exclude using gist (
  employee_id with =,
  day_of_week with =,
  work_range with &&
);
```

Así se rechaza:

```text
09:00-13:00
12:00-16:00
```

para mismo empleado/día.

# 13. employee_breaks

Se mantiene. Los breaks pueden solaparse funcionalmente; no es obligatorio un exclusion constraint para MVP.

# 14. employee_time_off

Mantener `start_at < end_at`.

Agregar:

```sql
create index employee_time_off_range_idx
on public.employee_time_off
using gist (
  employee_id,
  tstzrange(start_at, end_at, '[)')
);
```

# 15. customers

Agregar:

```text
normalized_phone text
```

Índice:

```sql
create index customers_normalized_phone_idx
on public.customers(normalized_phone)
where normalized_phone is not null;
```

No hacerlo UNIQUE.

Reglas:
- normalización preferida a E.164;
- teléfono es matching hint, no autenticación;
- una reserva pública nunca revela si el cliente ya existía;
- nunca sobrescribir automáticamente datos sensibles por simple match de teléfono;
- preferir duplicado ocasional antes que asociación incorrecta.

# 16. appointments

Agregar:

```text
public_access_token_hash bytea not null
```

`public_reference` sigue siendo `UNIQUE`, pero **no es secreto**.

Estrategia pública:

```text
public_reference
+
secret token aleatorio >= 128 bits
```

Guardar solo hash del token. El token se devuelve una sola vez al crear la reserva.

No crear índice adicional para `public_reference`, porque `UNIQUE` ya crea índice.

# 17. Anti-double-booking

Mantener obligatoriamente:

```sql
alter table public.appointments
add constraint appointments_employee_no_overlap
exclude using gist (
  employee_id with =,
  tstzrange(start_at, end_at, '[)') with &&
)
where (
  status in ('pending','confirmed','in_progress')
);
```

`[)` permite:

```text
10:00-11:00
11:00-12:00
```

Estados que bloquean:

```text
pending
confirmed
in_progress
```

No bloquean:

```text
completed
cancelled
no_show
```

La disponibilidad previa no garantiza exclusividad. La garantía real es:

```text
INSERT/UPDATE
+
EXCLUSION CONSTRAINT
+
TRANSACTION
```

# 18. appointment_services

Agregar snapshot del buffer:

```sql
alter table public.appointment_services
add column buffer_minutes integer not null default 0
check (buffer_minutes >= 0);
```

Snapshot histórico mínimo:

```text
service_name
duration_minutes
buffer_minutes
unit_price
quantity
sort_order
```

# 19. appointment_status_history

Se mantiene. No permitir UPDATE directo del historial.

# 20. business_settings

Mantener singleton MVP.

```sql
create unique index business_settings_singleton_uq
on public.business_settings ((true));
```

Para reservas usar siempre `branches.timezone`.

# 21. push_subscriptions

Se mantiene. Employee administra únicamente sus propios tokens.

# 22. notification_outbox

Estructura definitiva debe agregar:

```text
deduplication_key text
locked_at timestamptz
locked_by text
lease_expires_at timestamptz
```

Índices:

```sql
create unique index notification_outbox_dedup_uq
on public.notification_outbox(deduplication_key)
where deduplication_key is not null;
```

```sql
create index notification_outbox_ready_idx
on public.notification_outbox(next_attempt_at, created_at)
where status = 'pending';
```

```sql
create index notification_outbox_lease_idx
on public.notification_outbox(lease_expires_at)
where status = 'processing';
```

El worker debe reclamar trabajos con `FOR UPDATE SKIP LOCKED`.

Patrón:

```sql
with candidates as (
  select id
  from public.notification_outbox
  where (
      status = 'pending'
      and coalesce(next_attempt_at, now()) <= now()
    )
    or (
      status = 'processing'
      and lease_expires_at < now()
    )
  order by created_at
  for update skip locked
  limit 50
)
update public.notification_outbox o
set
  status = 'processing',
  locked_at = now(),
  lease_expires_at = now() + interval '5 minutes',
  locked_by = p_worker_id,
  attempt_count = attempt_count + 1
from candidates c
where o.id = c.id
returning o.*;
```

# 23. notification_deliveries

Agregar idempotencia:

```sql
create unique index notification_deliveries_provider_message_uq
on public.notification_deliveries(provider, provider_message_id)
where provider_message_id is not null;
```

Webhooks repetidos deben ser idempotentes.

# 24. Outbox deduplication

Ejemplos:

```text
appointment.created:{appointment_id}:push:{employee_id}
appointment.created:{appointment_id}:email:{customer_id}
appointment.reminder:{appointment_id}:24h:whatsapp
```

Retry inicial:

```text
1 inmediato
2 +1 min
3 +5 min
4 +15 min
5 failed
```

La reserva nunca falla porque FCM/WhatsApp/Email estén caídos.

# 25. RLS — principio

RLS controla filas, no columnas.

Por eso employee no recibe UPDATE directo de `appointments`.

```sql
revoke insert, update, delete
on public.appointments
from anon, authenticated;
```

Operaciones críticas únicamente por RPC.

# 26. Matriz RLS

| Recurso | anon | auth sin profile | employee | manager | admin |
|---|---|---|---|---|---|
| catálogo público | R | R | R | CRUD | CRUD |
| profiles | - | - | propia | limitada | CRUD |
| employee commission | - | - | - | según negocio | CRUD |
| employee_services | vía RPC | vía RPC | R propios | CRUD | CRUD |
| work hours | vía RPC | vía RPC | R propios | CRUD | CRUD |
| time off | - | - | R propios | CRUD | CRUD |
| customers | - | - | relacionados mínimos | CRUD | CRUD |
| appointments | - | - | R propias | R | R |
| appointment UPDATE directo | - | - | NO | NO recomendado | NO recomendado |
| change status | - | - | RPC limitada | RPC | RPC |
| reschedule | - | - | NO inicial | RPC | RPC |
| outbox | - | - | - | read opcional | R |
| push subscriptions | - | - | propias | R | R |
| settings | subset público | subset público | subset | RW | CRUD |
| roles | - | - | - | - | CRUD |

`authenticated` sin profile no obtiene privilegios staff.

# 27. Exposición pública de empleados

No hacer `select *` público sobre `employees`.

Exponer solo:

```text
id
first_name
last_name
bio
photo_url
branch_id
```

mediante vista segura o RPC.

No exponer:

```text
phone
commission_percent
profile_id
```

# 28. Availability Engine

Implementación recomendada:

```text
PL/pgSQL para orquestación
+
SQL set-based
+
Edge Function opcional como gateway
```

Edge puede aportar rate limiting, bot protection y telemetría, pero no reimplementar reglas de disponibilidad.

Contrato:

```text
branch_id uuid
service_ids uuid[]
employee_id uuid nullable
booking_date date
```

Algoritmo obligatorio:

1. validar branch activa;
2. obtener `branch.timezone`;
3. validar fecha y horizon;
4. rechazar service list vacía;
5. rechazar IDs duplicados en MVP;
6. validar servicios activos;
7. encontrar empleados activos/bookable de la branch;
8. exigir que presten TODOS los servicios;
9. aplicar `custom_duration_minutes`;
10. aplicar `custom_price`;
11. sumar `buffer_minutes`;
12. calcular duración ocupada total;
13. obtener día ISO local;
14. leer todas las work ranges;
15. convertirlas a `timestamptz` con branch timezone;
16. generar candidate starts por `booking_slot_interval_minutes`;
17. alinear slots desde medianoche local;
18. exigir que el rango completo quepa dentro de una franja laboral;
19. excluir breaks;
20. excluir time off;
21. excluir appointments bloqueantes;
22. respetar minimum booking notice;
23. respetar maximum booking horizon;
24. ordenar;
25. devolver solo datos públicos.

No almacenar miles de slots prefabricados.

# 29. "Cualquiera disponible"

Recomendación técnica:

`create_public_booking` puede recibir `employee_id = null` y resolver servidor-side un empleado compatible que siga disponible dentro de la transacción.

Esto reduce fallos por carreras posteriores a la consulta de disponibilidad.

# 30. create_public_booking

Arquitectura preferida:

```text
Browser
↓
Edge Function pública
  - rate limit
  - honeypot
  - Turnstile si aplica
  - phone normalization
↓
PostgreSQL RPC transaccional
```

Aceptar:

```text
branch_id
service_ids
employee_id nullable
start_at
customer.full_name
customer.phone
customer.email
customer.notes
privacy_consent
privacy_consent_version
honeypot
```

Nunca aceptar como autoridad:

```text
price
total_amount
duration
end_at
availability
```

Flujo transaccional:

```text
1 validar payload
2 validar consentimiento
3 validar branch
4 validar services
5 validar employee(s)
6 recalcular durations
7 recalcular buffers
8 recalcular prices
9 validar work hours
10 validar breaks
11 validar time off
12 availability fast-fail
13 match/create customer
14 generar reference
15 generar secret token
16 INSERT appointment
17 exclusion constraint = garantía final
18 INSERT appointment_services
19 INSERT status_history
20 INSERT notification_outbox
21 retornar resultado público
22 COMMIT
```

Si algo falla: `ROLLBACK`.

# 31. Conflicto concurrente

Mapear `exclusion_violation` a:

```text
slot_no_longer_available
```

sin exponer detalles internos.

Concepto:

```sql
exception
  when exclusion_violation then
    raise exception using
      errcode = 'P0001',
      message = 'slot_no_longer_available',
      detail = null,
      hint = null;
```

El catch debe provocar rollback de toda la operación.

# 32. get_public_booking_summary

Entrada:

```text
reference
access_token
```

Servidor:

1. hash del token;
2. comparación contra `public_access_token_hash`;
3. respuesta genérica si falla;
4. no revelar si la reference existe;
5. devolver solo resumen permitido.

Nunca devolver:

```text
customer_id
phone
email
internal_notes
profile_id
```

# 33. create_staff_booking

RPC, no inserts dispersos desde React.

Debe aplicar las mismas reglas de:
- precio;
- duración;
- work hours;
- breaks;
- time off;
- anti-overlap;
- snapshots;
- history;
- outbox.

# 34. reschedule_appointment

RPC transaccional:

```text
verify permission
SELECT appointment FOR UPDATE
validate status
recalculate duration
validate employee
validate schedule
UPDATE appointment
exclusion constraint
history
outbox
commit
```

No UPDATE directo desde UI.

# 35. change_appointment_status

Matriz MVP:

```text
pending -> confirmed
pending -> cancelled

confirmed -> in_progress
confirmed -> cancelled
confirmed -> no_show

in_progress -> completed
in_progress -> cancelled

completed -> terminal
cancelled -> terminal
no_show -> terminal
```

Employee solo sobre appointments propios y solo transiciones permitidas.

# 36. Cancelación

Debe:
- cambiar `status`;
- establecer `cancelled_at`;
- registrar history;
- generar outbox;
- liberar el slot transaccionalmente.

# 37. Deadlocks

Cuando una operación deba bloquear varias filas, usar orden determinista.

Si se bloquean empleados:

```text
ORDER BY employee_id
FOR UPDATE
```

Retry de deadlock solo server-side, limitado.

# 38. Realtime

Realtime no sustituye Outbox.

Employee recibe únicamente eventos de su agenda.

No emitir payloads globales con PII.

# 39. Índices recomendados

```sql
create index employees_branch_idx
on public.employees(branch_id);

create index employees_active_bookable_idx
on public.employees(branch_id, is_active, is_bookable);

create index employee_services_service_idx
on public.employee_services(service_id);

create index employee_work_hours_lookup_idx
on public.employee_work_hours(employee_id, day_of_week);

create index employee_breaks_lookup_idx
on public.employee_breaks(employee_id, day_of_week, is_active);

create index appointments_employee_start_idx
on public.appointments(employee_id, start_at);

create index appointments_branch_start_idx
on public.appointments(branch_id, start_at);

create index appointments_branch_status_start_idx
on public.appointments(branch_id, status, start_at);

create index appointments_customer_start_idx
on public.appointments(customer_id, start_at desc);
```

No crear índice extra para `public_reference`.

# 40. ON DELETE

Recomendación:

```text
auth.users -> profiles: CASCADE
profiles -> employees.profile_id: SET NULL
employees -> employee_services: CASCADE
employees -> work_hours: CASCADE
employees -> breaks: CASCADE
employees -> time_off: CASCADE
appointments -> appointment_services: CASCADE
appointments -> status_history: CASCADE
employees -> push_subscriptions: CASCADE
```

En producción no eliminar físicamente:
- employees;
- services usados;
- customers;
- appointments.

Preferir desactivación/estado.

# 41. SECURITY DEFINER grants

Patrón:

```sql
revoke all on function public.some_function(...) from public;
grant execute on function public.some_function(...) to authenticated;
```

Para funciones públicas, otorgar EXECUTE solo a `anon`/`authenticated` cuando corresponda.

# 42. PII

PII:

```text
full_name
phone
email
notes
```

No enviar a:
- Analytics;
- URLs;
- logs públicos;
- errores cliente;
- deduplication keys;
- Push excesivo.

# 43. Orden final de migraciones

1. `extensions_and_base_helpers`
2. `domain_types`
3. `profiles`
4. `basic_authorization_helpers`
5. `branches`
6. `service_categories`
7. `services`
8. `employees`
9. `current_employee_id_helper`
10. `employee_services`
11. `employee_work_hours`
12. `employee_work_hours_overlap_constraint`
13. `employee_breaks`
14. `employee_time_off`
15. `customers`
16. `business_settings`
17. `appointments`
18. `appointments_overlap_constraint`
19. `appointment_services`
20. `appointment_status_history`
21. `push_subscriptions`
22. `notification_outbox`
23. `notification_deliveries`
24. `public_catalog_views_or_rpcs`
25. `booking_internal_helpers`
26. `get_booking_availability_rpc`
27. `create_public_booking_rpc`
28. `get_public_booking_summary_rpc`
29. `create_staff_booking_rpc`
30. `reschedule_appointment_rpc`
31. `change_appointment_status_rpc`
32. `outbox_claim_rpc`
33. `gallery_items`
34. `testimonials`
35. `storage_policies`
36. `realtime_configuration`
37. `final_grants_and_rls`
38. `seed_development`

Formato real:

```text
YYYYMMDDHHMMSS_description.sql
```

# 44. Ajuste al Plan Maestro

`create_public_booking` necesita insertar `notification_outbox` en la misma transacción.

Por tanto, el esquema Outbox debe existir antes de implementar definitivamente `create_public_booking`.

Esto es un ajuste de dependencia técnica, no un permiso para adelantar el Sprint funcional de notificaciones.

# 45. Testing RLS mínimo

## anon

```text
customers SELECT -> deny
appointments SELECT -> deny
appointments INSERT -> deny
appointments UPDATE -> deny
availability RPC -> allow
public booking endpoint -> allow
public summary token correcto -> allow
public summary token incorrecto -> respuesta genérica
```

## authenticated sin profile

```text
private tables -> deny
staff RPC -> deny
```

## employee

```text
own appointment -> allow
other appointment -> deny
related customer minimum -> allow
unrelated customer -> deny
commission update -> deny
custom_price update -> deny
appointment employee_id reassignment -> deny
role escalation -> deny
```

## manager

```text
operational management -> allow
admin role change -> deny
```

## admin

```text
role management -> allow
settings -> allow
```

# 46. Booking tests

```text
valid booking
empty service list
duplicate service IDs
inactive service
invalid service
invalid employee
inactive employee
non-bookable employee
wrong branch
incompatible employee
outside work hours
inside break
partial time off
full time off
existing active appointment
existing cancelled appointment
multiple services
custom duration
custom price
buffers
minimum notice
maximum horizon
invalid consent
invalid phone
timezone boundary
```

# 47. Race condition test

Debe usar dos conexiones independientes.

Resultado obligatorio:

```text
exactly 1 success
exactly 1 slot_no_longer_available
exactly 1 appointment
no orphan customer
no duplicate history
no duplicate outbox
```

No sustituir esta prueba por dos llamadas secuenciales.

# 48. Status tests

```text
pending -> confirmed       ALLOW
pending -> cancelled       ALLOW
pending -> completed       DENY
confirmed -> in_progress   ALLOW
confirmed -> no_show       ALLOW
confirmed -> cancelled     ALLOW
confirmed -> completed     DENY
in_progress -> completed   ALLOW
in_progress -> cancelled   ALLOW
completed -> confirmed     DENY
cancelled -> confirmed     DENY
no_show -> confirmed       DENY
```

# 49. Outbox tests

```text
same dedup key -> one row
two workers -> one claim
expired lease -> retry
attempt_count increments
sent -> not reclaimed
provider failure -> retry
fifth failure -> failed
duplicate webhook -> no duplicate delivery
```

# 50. Performance tests

Antes de producción usar datos realistas y `EXPLAIN (ANALYZE, BUFFERS)` para:
- availability;
- agenda por branch/day;
- employee/day;
- outbox claim;
- customer search.

Seed de carga sugerido:

```text
20 employees
100 services
50,000 appointments
10,000 customers
10,000 outbox events
```

# 51. Reglas obligatorias para Claude

Claude debe:
1. leer los cuatro documentos;
2. inspeccionar repositorio antes de cada paso;
3. no avanzar fuera del paso actual;
4. no cambiar arquitectura silenciosamente;
5. no sustituir PostgreSQL constraint por JS;
6. no dar DML público directo a appointments;
7. no tratar authenticated como staff;
8. no asignar role por default;
9. no usar public_reference como único secreto;
10. no confiar en precio/duración del browser;
11. no usar service role en frontend;
12. no llamar proveedores externos en booking transaction;
13. usar Outbox;
14. usar `search_path = ''` en SECURITY DEFINER;
15. cualificar objetos;
16. revocar EXECUTE de PUBLIC;
17. ejecutar test de concurrencia real;
18. preservar PII;
19. respetar Definition of Done;
20. detenerse si surge una decisión arquitectónica nueva.

# 52. Decisiones humanas pendientes

## Employee modifica su propio horario
Recomendación inicial: **NO**. Solo manager/admin.

## Manager modifica comisiones
Recomendación inicial: **NO**. Solo admin.

## Service incompatibilities explícitas
No crear tabla mientras el negocio no confirme la necesidad.

## Cualquiera disponible
Recomendación: permitir `employee_id = null` y resolver server-side.

## Recuperar estados terminales
No permitir en MVP. Si se agrega, RPC separada + audit log.

# 53. Criterios antes del Wizard real

No avanzar al flujo real de reservas hasta tener:

```text
[ ] exclusion constraint probado
[ ] race test real aprobado
[ ] RLS anon aprobado
[ ] RLS employee aprobado
[ ] availability tests aprobados
[ ] create_public_booking tests aprobados
[ ] public summary token probado
[ ] status transitions probadas
[ ] outbox idempotency probada
```

# 54. Veredicto

```text
APROBADO CON CAMBIOS
```

Los cambios de auditoría ya están incorporados aquí.

Principio central:

```text
availability check != booking guarantee
```

Garantía final:

```text
PostgreSQL transaction
+
appointments_employee_no_overlap
```

Ningún frontend, Edge Function o comprobación previa puede reemplazar esta protección.
