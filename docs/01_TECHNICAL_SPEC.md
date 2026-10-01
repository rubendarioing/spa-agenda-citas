# Spa / Nail Salon — Especificación Técnica

> Fuente de verdad de arquitectura, base de datos, seguridad, reservas y notificaciones.

---

# 1. Estructura del repositorio

```text
spa-booking/
├── docs/
│   ├── 00_PROJECT_CONTEXT.md
│   ├── 01_TECHNICAL_SPEC.md
│   └── 02_EXECUTION_PLAN_CLAUDE.md
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── tests/
│   ├── seed.sql
│   └── config.toml
│
├── public/
│   ├── icons/
│   └── images/
│
├── src/
│   ├── app/
│   │   ├── router/
│   │   └── providers/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── forms/
│   │   ├── layout/
│   │   └── ui/
│   │
│   ├── features/
│   │   ├── appointments/
│   │   ├── booking/
│   │   ├── customers/
│   │   ├── employees/
│   │   ├── services/
│   │   ├── notifications/
│   │   └── dashboard/
│   │
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   │   ├── public/
│   │   └── admin/
│   │
│   ├── services/
│   ├── styles/
│   └── types/
│
├── .env.example
├── vercel.json
└── README.md
```

---

# 2. Convenciones

Base de datos:

```text
snake_case
```

TypeScript:

```text
camelCase
```

React:

```text
PascalCase
```

Código:

```text
inglés
```

Interfaz:

```text
español
```

---

# 3. Migraciones

Todo cambio de base de datos debe existir en:

```text
supabase/migrations/
```

Formato:

```text
YYYYMMDDHHMMSS_description.sql
```

Prohibido realizar cambios manuales permanentes únicamente mediante el Dashboard de Supabase.

Después de una migración:

1. aplicar migración;
2. ejecutar pruebas RLS;
3. regenerar tipos;
4. ejecutar typecheck;
5. ejecutar build.

---

# 4. Modelo de datos general

```text
auth.users
   │
   ▼
profiles
   │
   └── employees
          │
          ├── employee_services ── services ── service_categories
          ├── employee_work_hours
          ├── employee_breaks
          ├── employee_time_off
          └── push_subscriptions

branches

customers
   │
   ▼
appointments
   │
   ├── appointment_services
   ├── appointment_status_history
   └── notification_outbox

notifications / deliveries

business_settings

gallery_items

testimonials
```

---

# 5. Tablas

## 5.1 profiles

```text
id uuid PK → auth.users
full_name text
role enum/admin-manager-employee
is_active boolean
created_at timestamptz
updated_at timestamptz
```

---

# 5.2 branches

Crear desde MVP aunque inicialmente exista una sola sede.

```text
id
name
slug
address
city
phone
whatsapp
email
timezone
latitude
longitude
google_maps_url
is_active
created_at
updated_at
```

Default timezone:

```text
America/Bogota
```

---

# 5.3 service_categories

```text
id
name
slug
description
sort_order
is_active
created_at
updated_at
```

Ejemplos:

```text
Manicure
Pedicure
Acrílicas y Gel
Nail Art
Combos
```

---

# 5.4 services

```text
id
category_id
name
slug
description
price
duration_minutes
buffer_minutes
image_url
sort_order
is_active
created_at
updated_at
```

Constraints:

```text
price >= 0
duration_minutes > 0
buffer_minutes >= 0
slug unique
```

---

# 5.5 employees

```text
id
profile_id nullable
branch_id
first_name
last_name
bio
photo_url
phone
commission_percent
is_bookable
is_active
created_at
updated_at
```

`profile_id` puede ser nullable para permitir especialistas que todavía no tengan usuario administrativo.

---

# 5.6 employee_services

Relación N.

```text
employee_id
service_id
custom_price nullable
custom_duration_minutes nullable
```

PK:

```text
employee_id + service_id
```

---

# 5.7 employee_work_hours

Permite múltiples franjas en el mismo día.

Ejemplo:

```text
09:00-13:00
14:00-18:00
```

Campos:

```text
id
employee_id
day_of_week
start_time
end_time
created_at
```

Día:

```text
1 = lunes
...
7 = domingo
```

---

# 5.8 employee_breaks

Opcionalmente puede usarse para pausas recurrentes.

```text
id
employee_id
day_of_week
start_time
end_time
label
is_active
```

---

# 5.9 employee_time_off

Ausencias no recurrentes:

```text
id
employee_id
start_at
end_at
reason
created_at
```

Casos:

- vacaciones;
- incapacidad;
- permiso;
- bloqueo manual.

---

# 5.10 customers

```text
id
full_name
phone
email
notes
privacy_consent_at
privacy_consent_version
marketing_consent
created_at
updated_at
```

Índices:

```text
phone
lower(email)
lower(full_name)
```

No asumir que teléfono es único sin confirmar estrategia del negocio.

---

# 5.11 appointments

```text
id
public_reference
branch_id
customer_id
employee_id
start_at
end_at
status
total_amount
customer_notes
internal_notes
source
created_by
created_at
updated_at
cancelled_at
```

Estados:

```text
pending
confirmed
in_progress
completed
cancelled
no_show
```

Source:

```text
website
admin
phone
whatsapp
walk_in
```

`public_reference`:

- único;
- no secuencial;
- no exponer ID UUID como referencia pública.

---

# 5.12 appointment_services

Guardar snapshot histórico.

```text
id
appointment_id
service_id
service_name
duration_minutes
unit_price
quantity
sort_order
created_at
```

IMPORTANTE:

Aunque cambie posteriormente el servicio original, una cita pasada mantiene:

- nombre histórico;
- duración histórica;
- precio histórico.

---

# 5.13 appointment_status_history

```text
id
appointment_id
from_status
to_status
changed_by
notes
created_at
```

Registrar cambios importantes.

---

# 5.14 push_subscriptions

```text
id
employee_id
token
provider
device_label
is_active
last_seen_at
created_at
updated_at
```

Provider inicial:

```text
fcm
```

Token único.

---

# 5.15 notification_outbox

```text
id
event_type
aggregate_type
aggregate_id
recipient_type
recipient_id
channel
payload jsonb
status
attempt_count
next_attempt_at
created_at
processed_at
last_error
```

Estados:

```text
pending
processing
sent
failed
```

Canales:

```text
push
email
whatsapp
```

Nunca llamar directamente a servicios externos dentro de la transacción principal de creación de cita.

---

# 5.16 notification_deliveries

Histórico opcional:

```text
id
outbox_id
provider
provider_message_id
status
response_code
error_message
created_at
```

---

# 5.17 gallery_items

```text
id
image_url
alt_text
caption
sort_order
is_active
created_at
```

---

# 5.18 testimonials

```text
id
customer_name
content
rating
sort_order
is_active
created_at
```

---

# 5.19 business_settings

Puede ser singleton inicialmente.

```text
id
business_name
timezone
currency
phone
whatsapp
email
address
booking_slot_interval_minutes
minimum_booking_notice_minutes
maximum_booking_days_ahead
cancellation_notice_minutes
created_at
updated_at
```

Currency inicial:

```text
COP
```

---

# 6. Protección contra solapamientos

PostgreSQL debe ser la última línea de defensa.

Habilitar:

```sql
create extension if not exists btree_gist;
```

Implementar constraint equivalente a:

```sql
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

Resultado:

Dos citas activas no pueden ocupar simultáneamente al mismo empleado.

No sustituir este constraint por lógica JavaScript.

---

# 7. Motor de disponibilidad

RPC:

```text
get_booking_availability
```

Conceptualmente recibe:

```json
{
  "service_ids": [],
  "employee_id": null,
  "date": "YYYY-MM-DD"
}
```

Puede evolucionar hacia parámetros SQL tipados si resulta mejor.

Debe:

1. validar servicios activos;
2. calcular duración;
3. calcular buffers;
4. identificar especialistas compatibles;
5. consultar sus horarios;
6. restar pausas;
7. restar `time_off`;
8. restar citas activas;
9. generar posibles slots;
10. respetar intervalo configurable;
11. respetar antelación mínima;
12. respetar horizonte máximo.

Salida pública nunca debe contener datos privados.

Ejemplo:

```json
{
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

# 8. Regla de duración

Duración real:

```text
Σ duración del servicio para ese especialista
+
buffers definidos
```

Si `employee_services.custom_duration_minutes` existe, prevalece sobre duración estándar.

No confiar en duración calculada por frontend.

---

# 9. Regla de precio

Precio real:

```text
Σ precio del servicio para ese especialista
```

Si existe:

```text
custom_price
```

usar el personalizado.

No confiar en precio enviado desde React.

---

# 10. Crear reserva

Operación crítica:

```text
create_public_booking
```

Debe ejecutarse server-side mediante RPC o Edge Function transaccional.

El público NO hace insert directo a:

```text
customers
appointments
appointment_services
notification_outbox
```

---

# 11. Algoritmo create_public_booking

Debe:

1. validar payload;
2. validar consentimiento;
3. aplicar honeypot;
4. aplicar rate limit;
5. obtener servicios desde DB;
6. obtener empleado desde DB;
7. comprobar que empleado presta todos los servicios;
8. recalcular precio;
9. recalcular duración;
10. recalcular rango `start_at/end_at`;
11. comprobar jornada;
12. comprobar pausas;
13. comprobar time_off;
14. comprobar solapamientos;
15. encontrar o crear cliente;
16. crear cita;
17. crear snapshots de appointment_services;
18. crear status history inicial;
19. insertar eventos en notification_outbox;
20. hacer commit;
21. devolver solo información pública.

Nunca devolver datos privados de otros clientes.

---

# 12. Concurrencia

Caso obligatorio:

```text
Cliente A solicita 4:00 PM
Cliente B solicita 4:00 PM
```

Aunque ambos hayan visto disponibilidad:

solo una reserva puede confirmarse.

La segunda debe recibir código controlado:

```text
slot_no_longer_available
```

Debe existir test para este escenario.

---

# 13. API lógica

## Público

```text
GET  servicios
GET  empleados públicos
POST disponibilidad
POST crear reserva
GET  resumen público por reference
```

## Admin

```text
GET/PATCH servicios
GET/PATCH empleados
GET/POST/PATCH citas
GET clientes
GET/PATCH horarios
```

Cuando RLS permita un CRUD seguro, se puede utilizar Supabase directamente a través de `services`.

Las operaciones críticas usan RPC/Edge Functions.

---

# 14. Capa Services frontend

Ningún componente debe llamar directamente a Supabase.

Crear:

```text
services/
├── appointments.service.ts
├── booking.service.ts
├── branches.service.ts
├── customers.service.ts
├── employees.service.ts
├── gallery.service.ts
├── notifications.service.ts
└── services.service.ts
```

Componentes consumen:

```text
services
↓
hooks
↓
UI
```

---

# 15. Tipos

Generados:

```text
src/types/database.types.ts
```

Dominio:

```text
src/types/
├── appointment.ts
├── booking.ts
├── branch.ts
├── customer.ts
├── employee.ts
├── notification.ts
└── service.ts
```

Los componentes no deberían depender innecesariamente de tipos crudos de PostgreSQL.

---

# 16. RLS

Funciones de autorización previstas:

```text
is_staff()
is_admin()
is_manager()
is_employee()
current_employee_id()
```

No usar únicamente:

```text
auth.role() = 'authenticated'
```

como autorización.

Un usuario autenticado no implica acceso administrativo.

---

# 17. Acceso público

El público puede leer únicamente datos necesarios:

```text
branches activas
service_categories activas
services activos
employees públicos/bookable
gallery_items activos
testimonials activos
```

No exponer públicamente:

```text
employee.phone
employee.commission
customer.*
appointment.*
notification.*
profiles.*
```

---

# 18. Login interno

Supabase Auth email/password.

No se requiere signup público.

Usuarios administrativos se crean controladamente.

`ProtectedRoute`:

1. verifica sesión;
2. verifica `profiles`;
3. verifica `is_active`;
4. verifica rol;
5. permite/deniega ruta.

---

# 19. Storage

Buckets públicos:

```text
services
employees
gallery
branding
```

Escritura:

```text
solo staff autorizado
```

Tipos:

```text
image/webp
image/jpeg
image/png
```

Preferir WebP.

No subir datos privados a buckets públicos.

---

# 20. Notificaciones — arquitectura

```text
create_public_booking
        │
        ├── appointment
        └── notification_outbox
                     │
                  COMMIT
                     │
                     ▼
             Database Webhook
                     │
                     ▼
                Edge Function
              ┌──────┼───────┐
              ▼      ▼       ▼
             FCM   WhatsApp Email
```

---

# 21. Regla Outbox

La reserva debe poder finalizar correctamente aunque:

- FCM esté caído;
- WhatsApp falle;
- proveedor email falle.

Por eso:

```text
reserva
≠
entrega inmediata obligatoria de notificación
```

La notificación se procesa después del commit.

---

# 22. Push

Flujo:

```text
Employee login
↓
solicitar permiso explícitamente
↓
FCM token
↓
guardar push_subscription
```

Eventos:

```text
appointment.created
appointment.updated
appointment.cancelled
appointment.reminder
```

---

# 23. Service Worker

No activar durante fases tempranas del desarrollo.

Fase inicial:

```text
manifest
iconos
injectRegister: false
```

Fase final:

- activar SW;
- offline fallback;
- Push;
- actualización controlada.

No cachear:

```text
*.supabase.co
/admin APIs
datos de clientes
agenda
auth
tokens
```

---

# 24. Supabase Realtime

Utilizar Broadcast cuando corresponda.

Casos:

- nueva cita;
- cambio de estado;
- cancelación;
- reprogramación.

Un dashboard abierto se actualiza mediante Realtime.

Push no reemplaza Realtime.

---

# 25. WhatsApp

Solo mediante servidor.

Nunca colocar access tokens en frontend.

Plantillas:

```text
booking_confirmation
booking_reminder
booking_rescheduled
booking_cancelled
```

---

# 26. Recordatorios

No depender del navegador del usuario.

Crear mecanismo server-side programado.

Ejemplos:

```text
24 horas antes
2 horas antes
```

Los valores finales deben ser configurables.

---

# 27. Antispam

Formulario público:

- honeypot;
- validación;
- rate limit;
- longitud máxima de campos.

Si aparece spam:

```text
Cloudflare Turnstile
```

No agregar complejidad innecesaria en primera versión.

---

# 28. Auditoría

Para operaciones críticas considerar:

```text
audit_log
```

Especialmente:

- reprogramaciones;
- cancelaciones;
- cambios manuales;
- cambios de estado;
- administración de empleados.

No es obligatorio para primer sprint.

---

# 29. Estados UI obligatorios

Toda consulta remota:

```text
loading
success
empty
error
```

Nunca dejar pantalla en blanco.

---

# 30. Manejo de errores

No mostrar:

- SQL errors;
- stack traces;
- claves;
- IDs sensibles.

Traducir códigos conocidos a mensajes en español.

Ejemplo:

```text
slot_no_longer_available
```

→

```text
Ese horario acaba de ser reservado. Elige otro horario disponible.
```

---

# 31. FullCalendar

Inicialmente:

```text
dayGridMonth
timeGridWeek
timeGridDay
```

Evitar drag/drop de producción hasta validar server-side:

- disponibilidad;
- horario;
- solapamiento.

---

# 32. PWA

Cachear únicamente:

- app shell;
- CSS;
- JS versionado;
- imágenes públicas esenciales;
- offline page.

No presentar información administrativa cacheada como si fuera actual.

---

# 33. Testing obligatorio

## DB

- RLS anon.
- autenticado sin staff.
- employee.
- manager.
- admin.

## Reservas

- slot válido;
- slot fuera de jornada;
- time off;
- pausa;
- empleado incompatible;
- servicio desactivado;
- precio manipulado;
- duración manipulada;
- doble reserva;
- cita cancelada libera slot;
- múltiples servicios;
- "cualquiera disponible".

## UI

- 375px;
- tablet;
- desktop.

## PWA

- manifest;
- instalación;
- offline;
- Push;
- logout.

---

# 34. Seguridad absoluta

Nunca:

```text
service_role en navegador
secrets en Git
precio confiado al frontend
duración confiada al frontend
solapamiento resuelto solo con JavaScript
WhatsApp API desde React
FCM server credentials desde React
datos privados cacheados
insert público arbitrario a appointments
```

---

# 35. Definition of Done técnica

Una tarea no está terminada si aplica cualquiera de estas:

```text
lint falla
typecheck falla
build falla
tests aplicables fallan
RLS no verificado
migración no reproducible
faltan estados UI
hay secretos
hay código fuera del alcance
```
