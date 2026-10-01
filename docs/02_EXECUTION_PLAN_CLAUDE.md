# Plan Maestro de Ejecución con Claude

> Claude debe leer completamente:
>
> - `docs/00_PROJECT_CONTEXT.md`
> - `docs/01_TECHNICAL_SPEC.md`
> - `docs/02_EXECUTION_PLAN_CLAUDE.md`
> - `docs/04_DATABASE_ARCHITECTURE_APPROVED.md`
>
> antes de trabajar.
>
> `docs/03_DATABASE_SCHEMA.md` se conserva como referencia histórica de la propuesta de base de datos previa a la auditoría especializada.
>
> Para decisiones de PostgreSQL, Supabase, RLS, RPC, reservas, concurrencia, seguridad de datos, migraciones y Outbox, `04_DATABASE_ARCHITECTURE_APPROVED.md` prevalece sobre cualquier decisión conflictiva de `01_TECHNICAL_SPEC.md` o `03_DATABASE_SCHEMA.md`.
>
> Este documento controla orden, alcance y Definition of Done.

---

# 1. Regla principal

Trabajar:

```text
UN PASO A LA VEZ
```

Está prohibido avanzar automáticamente al paso siguiente.

No pedir:

```text
Construye toda la aplicación.
```

---

# 2. Método de trabajo

Cada tarea sigue:

```text
Plan Maestro
    ↓
Paso actual
    ↓
Inspeccionar código existente
    ↓
Verificar documentos aplicables
    ↓
Implementar únicamente el paso
    ↓
Tests
    ↓
Lint
    ↓
Typecheck
    ↓
Build
    ↓
Reporte
    ↓
STOP
```

Si durante un paso existe una decisión de PostgreSQL/Supabase, Claude debe consultar:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

antes de implementarla.

No debe reconciliar silenciosamente contradicciones entre documentos.

---

# 3. Sprint 0 — Fundación

## Paso 01

Crear repositorio y README.

DoD:

- `.gitignore`;
- README;
- `.env.example`;
- estructura inicial.

---

## Paso 02

React + Vite + TypeScript strict.

DoD:

```text
npm run dev
npm run build
```

funcionan.

---

## Paso 03

Tailwind CSS.

---

## Paso 04

shadcn/ui.

Probar al menos:

- Button;
- Card.

---

## Paso 05

ESLint + Prettier.

Scripts:

```text
lint
typecheck
build
```

---

## Paso 06

React Router.

Crear rutas provisionales públicas y administrativas.

---

## Paso 07

Estructura feature-based definida en especificación técnica.

---

## Paso 08

Vercel.

Agregar:

```text
vercel.json
```

para React Router.

Preview por ramas.

---

## Paso 09

PWA fase 1.

Instalar:

```text
vite-plugin-pwa
```

Crear:

- manifest;
- iconos;
- theme color.

NO registrar Service Worker todavía.

---

## Paso 10

Design system.

Definir:

- colores;
- tipografía;
- spacing;
- border radius;
- Button;
- Input;
- Card;
- Badge;
- Dialog.

---

# 4. Sprint 1 — Supabase y catálogo

A partir de este sprint cualquier decisión de base de datos debe respetar:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

No implementar automáticamente definiciones antiguas de:

```text
03_DATABASE_SCHEMA.md
```

si fueron corregidas durante la auditoría.

---

## Paso 11

Proyecto Supabase + CLI.

Configurar variables.

Nunca versionar secretos.

---

## Paso 12

Crear helpers DB y extensiones necesarias según:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

No asumir que la versión previa de `03_DATABASE_SCHEMA.md` sigue vigente.

---

## Paso 13

Crear `profiles` y funciones de autorización según la arquitectura aprobada.

Incluye las funciones definidas finalmente en:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

RLS y pruebas.

---

## Paso 14

Crear `branches`.

RLS.

Seed de una sede.

La definición exacta debe provenir de:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

---

## Paso 15

Crear `service_categories`.

RLS.

Seed.

---

## Paso 16

Crear `services`.

RLS.

Seed.

---

## Paso 17

Crear `employees`.

RLS.

Distinguir columnas públicas/privadas utilizando la estrategia aprobada.

---

## Paso 18

Crear `employee_services`.

RLS.

Seed.

---

## Paso 19

Crear horarios laborales usando el modelo aprobado.

---

## Paso 20

Crear pausas recurrentes si continúan formando parte de la arquitectura aprobada.

---

## Paso 21

Crear disponibilidad no recurrente / time off utilizando el modelo aprobado.

---

## Paso 22

Consolidar seed de desarrollo.

Ejemplo funcional esperado:

```text
1 sede
5 categorías
10 servicios
3 especialistas
horarios laborales
relaciones servicio/especialista
```

La estructura exacta debe respetar el modelo aprobado.

---

## Paso 23

Generar tipos Supabase.

Crear:

```text
src/types/database.types.ts
```

---

## Paso 24

Tests RLS Sprint 1.

Validar como mínimo:

- anon;
- authenticated sin profile;
- employee;
- manager;
- admin.

La matriz definitiva de permisos es la de:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

---

# 5. Sprint 2 — Motor de reservas

Este sprint es el núcleo crítico.

No acelerar.

Todas las operaciones de este sprint deben seguir estrictamente:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

---

## Paso 25

Crear estructura de clientes según arquitectura aprobada.

RLS.

---

## Paso 26

Crear estructura de citas/reservas.

Agregar estados y mecanismo público de referencia aprobado.

---

## Paso 27

Implementar la protección anti-solapamiento y concurrencia exactamente como haya sido aprobada.

Crear tests.

No reemplazar protección PostgreSQL por lógica JavaScript.

---

## Paso 28

Crear estructura para servicios asociados a la cita y snapshots históricos según arquitectura aprobada.

---

## Paso 29

Crear historial/auditoría de estados de cita según arquitectura aprobada.

---

## Paso 30

Crear configuración del negocio necesaria para disponibilidad y reservas.

Debe cubrir como mínimo, si siguen vigentes:

```text
timezone
currency
booking slot interval
minimum notice
maximum days ahead
```

La definición definitiva proviene de:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

---

## Paso 31

Implementar el motor/RPC de disponibilidad aprobado.

NO hacer UI todavía.

---

## Paso 32

Tests disponibilidad.

Cubrir todos los casos definidos en:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

y como mínimo:

- jornada;
- pausas;
- time off/bloqueos;
- citas existentes;
- duración;
- buffers;
- múltiples servicios;
- especialista incompatible;
- cualquiera disponible;
- zona horaria;
- límites de anticipación.

---

## Paso 33

Implementar operación transaccional de reserva pública según arquitectura aprobada.

---

## Paso 34

Tests de reserva pública.

Deben cubrir los casos establecidos en:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

incluyendo como mínimo:

```text
success
servicio inválido
empleado inválido
incompatibilidad
precio manipulado
duración manipulada
fuera de jornada
time off
slot ocupado
honeypot
rate limit
consentimiento
```

---

## Paso 35

Prueba real de concurrencia.

Simular dos reservas simultáneas.

Resultado obligatorio:

```text
una funciona
una es rechazada de manera controlada
```

El código público exacto del error debe ser el definido en:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

---

# 6. Sprint 3 — Web pública

## Paso 36

Services frontend de lectura.

---

## Paso 37

Componentes comunes:

```text
LoadingState
ErrorState
EmptyState
PageContainer
SectionTitle
ErrorBoundary
```

---

## Paso 38

PublicLayout.

- Header.
- Menú desktop.
- Menú móvil.
- Footer.
- WhatsApp button.

---

## Paso 39

Home.

---

## Paso 40

Página Servicios.

---

## Paso 41

Detalle servicio.

---

## Paso 42

Equipo.

---

## Paso 43

Galería.

---

## Paso 44

Nosotros.

---

## Paso 45

Contacto y mapa.

---

## Paso 46

Privacidad.

Borrador.

Debe revisarse legalmente antes de producción.

---

# 7. Sprint 4 — Wizard de reserva

## Paso 47

Estructura del Wizard `/reservar`.

Estado persistente solo durante flujo.

---

## Paso 48

Paso Servicios.

Selección múltiple.

---

## Paso 49

Paso Especialista.

Incluye:

```text
Cualquiera disponible
```

---

## Paso 50

Paso Fecha y hora.

Consumir únicamente disponibilidad real del servidor mediante el contrato aprobado.

---

## Paso 51

Datos cliente.

React Hook Form + Zod.

---

## Paso 52

Enviar reserva utilizando únicamente la operación pública aprobada en:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

No insertar directamente en tablas sensibles.

---

## Paso 53

Confirmación.

Utilizar el mecanismo público de consulta/referencia aprobado.

La ruta frontend podrá ser:

```text
/reserva/:reference
```

solo si coincide con la estrategia de seguridad aprobada.

---

## Paso 54

QA completo del flujo público.

---

# 8. Sprint 5 — Administración

## Paso 55

Login Supabase Auth.

---

## Paso 56

ProtectedRoute.

Validar perfil y rol.

---

## Paso 57

AdminLayout.

Responsive.

---

## Paso 58

Dashboard inicial.

---

## Paso 59

FullCalendar.

Solo lectura inicialmente.

---

## Paso 60

Detalle cita.

---

## Paso 61

Cambiar estado mediante la operación controlada aprobada.

No realizar updates arbitrarios si la arquitectura define RPC específica.

---

## Paso 62

Crear cita manual.

Aplicar exactamente las mismas reglas de disponibilidad y concurrencia.

Utilizar la operación administrativa aprobada.

---

## Paso 63

Reprogramar cita.

Implementar mediante la operación transaccional aprobada.

---

## Paso 64

Cancelar cita.

Implementar mediante la operación aprobada.

---

## Paso 65

CRUD servicios.

---

## Paso 66

CRUD categorías.

---

## Paso 67

CRUD empleados.

---

## Paso 68

Asignación servicios/empleado.

---

## Paso 69

Horarios laborales.

---

## Paso 70

Días libres y bloqueos.

---

## Paso 71

Clientes.

Listado y detalle según políticas RLS aprobadas.

---

## Paso 72

Vista específica para empleado.

Mostrar principalmente:

- hoy;
- próxima cita;
- agenda;
- estado.

Respetar estrictamente las políticas de visibilidad aprobadas.

---

# 9. Sprint 6 — Notificaciones

Todo el diseño de persistencia e idempotencia de notificaciones debe seguir:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

---

## Paso 73

Crear estructura de suscripciones Push aprobada.

RLS.

---

## Paso 74

Crear Outbox según diseño aprobado.

Debe incluir los mecanismos de idempotencia/deduplicación definidos en la arquitectura final.

---

## Paso 75

Crear histórico de entregas si forma parte de la arquitectura aprobada.

---

## Paso 76

Generar evento de creación de cita.

Sin integración externa todavía.

---

## Paso 77

Edge Function para procesar Outbox.

---

## Paso 78

Firebase Cloud Messaging.

Backend.

---

## Paso 79

FCM frontend.

Obtener token con consentimiento.

---

## Paso 80

Service Worker Push.

---

## Paso 81

Nueva cita → Push empleado.

---

## Paso 82

Realtime dashboard.

Supabase Broadcast según configuración y autorización aprobadas.

---

## Paso 83

Email de confirmación.

---

## Paso 84

WhatsApp confirmación.

---

## Paso 85

Recordatorios programados.

Ejemplo inicial:

```text
24h
2h
```

Configurables.

---

## Paso 86

Retry y errores de notificaciones.

Respetar estrategia aprobada de:

- retries;
- idempotencia;
- deduplicación;
- estados;
- errores permanentes.

---

# 10. Sprint 7 — Calidad y lanzamiento

## Paso 87

Storage de imágenes.

---

## Paso 88

Responsive completo.

Probar:

```text
375
768
1024
1440
```

---

## Paso 89

Accesibilidad.

WCAG AA razonable.

---

## Paso 90

SEO.

---

## Paso 91

Performance.

Objetivo Lighthouse inicial:

```text
Performance >= 90
Accessibility >= 90
Best Practices >= 90
SEO >= 90
```

---

## Paso 92

PWA fase 2.

Activar Service Worker.

---

## Paso 93

Offline fallback.

---

## Paso 94

QA PWA.

---

## Paso 95

QA seguridad.

Reejecutar RLS completo según matriz aprobada.

---

## Paso 96

QA concurrencia.

Reejecutar pruebas críticas definidas en la arquitectura aprobada.

---

## Paso 97

QA notificaciones.

---

## Paso 98

Contenido real.

Eliminar datos de demostración.

---

## Paso 99

Supabase producción.

Aplicar migraciones mediante CLI.

No realizar cambios manuales no versionados en producción.

---

## Paso 100

Dominio + HTTPS.

---

## Paso 101

Analytics y Search Console.

Nunca enviar PII.

---

## Paso 102

Lanzamiento.

---

# 11. Reglas obligatorias para Claude

Claude debe cumplir SIEMPRE:

1. No avanzar fuera del paso actual.
2. Leer los cuatro documentos vigentes antes de tomar decisiones arquitectónicas:
   - `00_PROJECT_CONTEXT.md`
   - `01_TECHNICAL_SPEC.md`
   - `02_EXECUTION_PLAN_CLAUDE.md`
   - `04_DATABASE_ARCHITECTURE_APPROVED.md`
3. Consultar `03_DATABASE_SCHEMA.md` únicamente como referencia histórica; nunca permitir que prevalezca sobre `04_DATABASE_ARCHITECTURE_APPROVED.md`.
4. Para cualquier decisión de PostgreSQL, Supabase, RLS, RPC, reservas, concurrencia, seguridad de datos, migraciones u Outbox, seguir `04_DATABASE_ARCHITECTURE_APPROVED.md`.
5. No reconciliar silenciosamente contradicciones entre documentos.
6. Mantener TypeScript strict.
7. No usar `any` innecesariamente.
8. Migraciones versionadas.
9. Regenerar tipos después de cambios de DB.
10. RLS en datos privados según arquitectura aprobada.
11. Nunca usar `authenticated` como equivalente automático a staff.
12. Nunca exponer `service_role`.
13. Nunca confiar en precio enviado desde frontend.
14. Nunca confiar en duración enviada desde frontend.
15. Nunca confiar en disponibilidad calculada desde frontend.
16. Nunca reemplazar protección PostgreSQL por una comprobación JavaScript.
17. Nunca llamar FCM/WhatsApp/Email desde una transacción crítica de reserva.
18. Utilizar el patrón Outbox aprobado.
19. Respetar idempotencia y deduplicación aprobadas.
20. No cachear información privada.
21. No refactorizar código fuera de alcance.
22. Mobile first.
23. `loading/error/empty` obligatorios.
24. accesibilidad razonable.
25. ejecutar tests aplicables, lint, typecheck y build antes de declarar terminado.

---

# 12. Resolución de contradicciones

Si Claude encuentra una contradicción que puede resolverse por autoridad documental, debe aplicar la fuente correspondiente.

Ejemplos:

```text
Producto/UX
→ 00_PROJECT_CONTEXT.md

Orden de ejecución / DoD
→ 02_EXECUTION_PLAN_CLAUDE.md

PostgreSQL / Supabase / DB / RLS / RPC / concurrencia / Outbox
→ 04_DATABASE_ARCHITECTURE_APPROVED.md

Arquitectura técnica general no redefinida
→ 01_TECHNICAL_SPEC.md
```

Si la contradicción no puede resolverse mediante estas reglas, Claude debe detener esa parte y reportar:

```text
DECISIÓN ARQUITECTÓNICA REQUERIDA

Documentos en conflicto:
Secciones:
Contradicción:
Impacto:
Recomendación:
Archivos/migraciones afectados:
```

No modificar silenciosamente una decisión aprobada.

---

# 13. Formato obligatorio de cierre

Claude debe terminar cada paso con:

```text
## 1. Resumen
## 2. Archivos creados
## 3. Archivos modificados
## 4. Migraciones
## 5. Decisiones técnicas
## 6. Seguridad / RLS
## 7. Comandos
## 8. Tests realizados
## 9. Pruebas manuales
## 10. Definition of Done
## 11. Riesgos / pendientes
## 12. Confirmación de alcance
```

Y escribir explícitamente:

```text
No avancé al siguiente paso del Plan Maestro.
```

---

# 14. Definition of Done

Una tarea está terminada solo cuando:

```text
[ ] alcance implementado
[ ] sin secretos
[ ] TypeScript correcto
[ ] lint correcto
[ ] typecheck correcto
[ ] build correcto
[ ] tests aplicables correctos
[ ] migraciones reproducibles cuando aplica
[ ] RLS probado cuando aplica
[ ] arquitectura aprobada respetada
[ ] estados UI considerados
[ ] responsive considerado
[ ] accesibilidad considerada
[ ] archivos documentados
[ ] pruebas manuales indicadas
[ ] no se implementó el siguiente paso
```

---

# 15. Prompt para iniciar una nueva conversación con Claude

Usar:

```text
Lee completamente y toma como contexto obligatorio:

- docs/00_PROJECT_CONTEXT.md
- docs/01_TECHNICAL_SPEC.md
- docs/02_EXECUTION_PLAN_CLAUDE.md
- docs/04_DATABASE_ARCHITECTURE_APPROVED.md

Puedes consultar docs/03_DATABASE_SCHEMA.md únicamente como referencia histórica de la propuesta previa a la auditoría.

Para decisiones de PostgreSQL, Supabase, RLS, RPC, concurrencia, reservas, seguridad de datos, migraciones y Outbox, 04_DATABASE_ARCHITECTURE_APPROVED.md prevalece sobre cualquier decisión conflictiva de 01_TECHNICAL_SPEC.md o 03_DATABASE_SCHEMA.md.

00_PROJECT_CONTEXT.md gobierna producto, alcance y UX.

02_EXECUTION_PLAN_CLAUDE.md gobierna orden de implementación, pasos y Definition of Done.

Antes de escribir código, revisa también el estado actual del repositorio.

No quiero que construyas todo el sistema de una vez.

Trabajaremos estrictamente un paso a la vez siguiendo
02_EXECUTION_PLAN_CLAUDE.md.

No reconcilies silenciosamente contradicciones.

Si encuentras una contradicción que no pueda resolverse mediante la autoridad documental, reporta una DECISIÓN ARQUITECTÓNICA REQUERIDA antes de implementar esa parte.

No avances al paso siguiente hasta que yo lo indique.

Comenzaremos con el Paso 01.

Antes de modificar archivos dime brevemente:

1. qué entendiste del proyecto;
2. cuál es el alcance exacto del Paso 01;
3. qué documentos gobiernan este paso;
4. qué archivos esperas crear o modificar;
5. qué cosas NO vas a implementar todavía.

Después comienza la implementación.

Al finalizar respeta completamente el formato de cierre y la Definition of Done.

Finaliza confirmando:

No avancé al siguiente paso del Plan Maestro.
```

---

# 16. Prompt para continuar después de cada paso

```text
Lee nuevamente:

- docs/00_PROJECT_CONTEXT.md
- docs/01_TECHNICAL_SPEC.md
- docs/02_EXECUTION_PLAN_CLAUDE.md
- docs/04_DATABASE_ARCHITECTURE_APPROVED.md

Consulta docs/03_DATABASE_SCHEMA.md únicamente como referencia histórica.

Revisa también el estado actual del repositorio.

El paso anterior ya fue aprobado.

Implementa únicamente el Paso XX del Plan Maestro.

No avances al Paso XX+1.

Para cualquier decisión de PostgreSQL, Supabase, RLS, RPC, reservas, concurrencia, seguridad de datos, migraciones u Outbox, sigue 04_DATABASE_ARCHITECTURE_APPROVED.md.

Respeta completamente la Definition of Done y al finalizar entrega el reporte obligatorio definido en 02_EXECUTION_PLAN_CLAUDE.md.
```

---

# 17. Si Claude detecta un problema arquitectónico

Debe detener esa parte y explicar:

```text
DECISIÓN ARQUITECTÓNICA REQUERIDA

Problema:
...

Documentos en conflicto:
...

Secciones:
...

Por qué importa:
...

Alternativa A:
...

Alternativa B:
...

Recomendación:
...

Migraciones/archivos afectados:
...
```

No debe cambiar silenciosamente la arquitectura.

---

# 18. Filosofía final

El proyecto debe construirse en este orden mental:

```text
integridad de datos
    ↓
seguridad
    ↓
motor de reservas
    ↓
experiencia
    ↓
notificaciones
    ↓
optimización
```

Nunca al contrario.
