# Spa / Nail Salon — PWA de Reservas

Aplicación web responsive y PWA para un spa/salón de belleza especializado en manicure, pedicure, esmaltado semipermanente, uñas acrílicas, uñas en gel y nail art.

El sistema está compuesto por dos módulos:

1. **Sitio público** — catálogo de servicios, equipo, galería y flujo de reserva de citas.
2. **Panel administrativo** — gestión de agenda, citas, clientes, empleados, servicios y horarios para administradores, managers y empleados.

El núcleo del sistema es: **disponibilidad + reservas + concurrencia + notificaciones**. La prevención de doble reserva se garantiza a nivel de PostgreSQL (exclusion constraint + transacción), nunca solo con lógica de frontend.

## Stack oficial

- **Frontend:** React, Vite, TypeScript (strict), React Router, Tailwind CSS, shadcn/ui, React Hook Form, Zod, TanStack Query, date-fns, FullCalendar.
- **Backend:** Supabase (PostgreSQL, Auth, Row Level Security, Storage, RPC, Realtime Broadcast, Database Webhooks, Edge Functions).
- **PWA:** vite-plugin-pwa, Web App Manifest, Service Worker, Firebase Cloud Messaging (Web Push).
- **Integraciones:** WhatsApp Business Cloud API, email transaccional, Google Maps, Google Analytics, Search Console.
- **Infraestructura:** GitHub, Vercel, Supabase.

## Estado actual

Proyecto en construcción siguiendo un plan maestro paso a paso (`docs/02_EXECUTION_PLAN_CLAUDE.md`). Actualmente en **Sprint 0 — Fundación**.

No se avanza al siguiente paso del plan hasta validar el paso actual.

## Documentación del proyecto

Toda decisión de producto, arquitectura y ejecución vive en `docs/`:

- `docs/00_PROJECT_CONTEXT.md` — producto, alcance y UX (fuente de verdad de producto).
- `docs/01_TECHNICAL_SPEC.md` — arquitectura técnica general.
- `docs/02_EXECUTION_PLAN_CLAUDE.md` — plan maestro de ejecución, pasos y Definition of Done.
- `docs/04_DATABASE_ARCHITECTURE_APPROVED.md` — arquitectura de base de datos aprobada (fuente de verdad definitiva para PostgreSQL, Supabase, RLS, RPC, concurrencia, reservas y Outbox).
- `docs/03_DATABASE_SCHEMA.md` — propuesta histórica de base de datos, anterior a la auditoría especializada. No prevalece sobre `04_DATABASE_ARCHITECTURE_APPROVED.md`.

## Configuración local

La configuración de dependencias, scripts (`dev`, `build`, `lint`, `typecheck`) y estructura de carpetas se incorporarán en los próximos pasos del plan maestro (Paso 02 en adelante).

Variables de entorno: ver `.env.example`.
