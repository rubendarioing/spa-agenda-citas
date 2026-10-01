# Spa / Nail Salon PWA — Contexto General del Proyecto

> Este documento define el producto, alcance, usuarios, experiencia, stack y decisiones principales.
>
> Claude debe leer este documento completo antes de modificar código.

---

# 0. Autoridad documental

Los documentos del proyecto tienen responsabilidades diferentes.

No debe interpretarse que existe una única jerarquía global para todas las decisiones.

## 0.1 Producto, alcance y UX

Este archivo:

```text
00_PROJECT_CONTEXT.md
```

es la fuente de verdad para:

- objetivos del producto;
- alcance funcional;
- experiencia de usuario;
- roles desde la perspectiva del producto;
- módulos;
- funcionalidades;
- prioridades;
- decisiones UX/UI;
- funcionalidades incluidas y excluidas del MVP.

## 0.2 Arquitectura técnica general

El archivo:

```text
01_TECHNICAL_SPEC.md
```

es la referencia principal para:

- stack;
- estructura del repositorio;
- convenciones técnicas;
- frontend;
- PWA;
- integraciones;
- arquitectura general;

excepto cuando una decisión haya sido refinada por un documento especializado posterior.

## 0.3 Ejecución del proyecto

El archivo:

```text
02_EXECUTION_PLAN_CLAUDE.md
```

es la fuente de verdad para:

- orden de implementación;
- pasos;
- sprints;
- Definition of Done;
- reglas de trabajo con Claude;
- control de alcance;
- formato de entrega de cada paso.

## 0.4 Base de datos aprobada

El archivo:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

es la fuente de verdad definitiva para cualquier decisión relacionada con:

- PostgreSQL;
- Supabase;
- tablas;
- columnas;
- relaciones;
- constraints;
- índices;
- RLS;
- autorización en base de datos;
- funciones `SECURITY DEFINER`;
- grants;
- RPC;
- motor de disponibilidad;
- reservas;
- concurrencia;
- prevención de doble reserva;
- transacciones;
- cambios de estado;
- reprogramaciones;
- cancelaciones;
- patrón Outbox;
- idempotencia;
- Realtime relacionado con datos;
- migraciones SQL;
- testing de base de datos.

Cuando exista una contradicción entre:

```text
01_TECHNICAL_SPEC.md
03_DATABASE_SCHEMA.md
04_DATABASE_ARCHITECTURE_APPROVED.md
```

para cualquiera de los temas anteriores, prevalece:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

## 0.5 Documento histórico de base de datos

El archivo:

```text
03_DATABASE_SCHEMA.md
```

se conserva como referencia histórica de la propuesta previa a la auditoría especializada.

No debe utilizarse para implementar una decisión que contradiga:

```text
04_DATABASE_ARCHITECTURE_APPROVED.md
```

## 0.6 Conflictos no resueltos

Si Claude encuentra una contradicción que no pueda resolverse mediante las responsabilidades anteriores, no debe reconciliarla silenciosamente.

Debe reportar:

```text
DECISIÓN ARQUITECTÓNICA REQUERIDA

Documentos en conflicto:
Secciones:
Contradicción:
Impacto:
Recomendación:
Archivos/migraciones afectados:
```

y esperar aprobación antes de modificar esa decisión.

---

# 1. Objetivo

Construir una aplicación web completa, responsive y PWA para un Spa / Salón de Belleza especializado principalmente en:

- Manicure.
- Pedicure.
- Esmaltado semipermanente.
- Uñas acrílicas.
- Uñas en gel.
- Nail Art.
- Servicios complementarios.

El sistema tendrá dos grandes módulos:

1. Sitio público y sistema de reservas.
2. Panel administrativo para administradores y empleados.

La referencia conceptual inicial es SuperNails Colombia, pero NO se debe copiar literalmente su diseño.

La aplicación debe mejorar la referencia en:

- experiencia móvil;
- proceso de reservas;
- velocidad;
- accesibilidad;
- estética;
- administración;
- notificaciones;
- arquitectura;
- seguridad.

---

# 2. Principios del producto

Prioridades:

1. experiencia móvil;
2. facilidad para reservar;
3. prevención de doble reserva;
4. simplicidad operativa;
5. seguridad;
6. bajo costo de infraestructura;
7. mantenibilidad;
8. escalabilidad razonable;
9. excelente experiencia para empleados;
10. estética premium.

No se debe sacrificar integridad de reservas por simplificar código.

---

# 3. Stack oficial

## Frontend

- React.
- Vite.
- TypeScript strict.
- React Router.
- Tailwind CSS.
- shadcn/ui.
- React Hook Form.
- Zod.
- TanStack Query.
- date-fns.
- Lucide Icons.
- FullCalendar para agenda administrativa.

## Backend

Supabase:

- PostgreSQL.
- Auth.
- Row Level Security.
- Storage.
- RPC PostgreSQL.
- Realtime Broadcast.
- Database Webhooks.
- Edge Functions.

## PWA

- vite-plugin-pwa.
- Web App Manifest.
- Service Worker.
- Firebase Cloud Messaging para Web Push.

## Integraciones

- WhatsApp Business Cloud API.
- Email transaccional.
- Google Maps.
- Google Analytics.
- Google Search Console.

## Infraestructura

- GitHub.
- Vercel.
- Supabase.
- dominio personalizado.

---

# 4. Arquitectura general

```text
GitHub
   │
   ├── feature/*
   │     └── Vercel Preview
   │
   └── main
         └── Vercel Production
                    │
                    ▼
          React + Vite + TypeScript
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
 Sitio público              Admin PWA
        │                        │
        └────────────┬───────────┘
                     ▼
                  Supabase
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   PostgreSQL       Auth        Storage
   + RLS/RPC
        │
        ├──────── Realtime
        │
        └──────── Database Webhooks
                         │
                         ▼
                   Edge Functions
                  ┌──────┼──────┐
                  ▼      ▼      ▼
                 FCM  WhatsApp Email
```

---

# 5. Zona horaria

Zona horaria inicial del negocio:

```text
America/Bogota
```

Reglas:

- almacenar timestamps en PostgreSQL como `timestamptz`;
- nunca guardar offsets UTC escritos manualmente;
- mostrar fechas y horas utilizando la zona horaria configurada del negocio;
- preparar arquitectura para soportar otras zonas horarias en el futuro.

---

# 6. Roles

Inicialmente existirán:

```text
admin
manager
employee
```

## Admin

Puede:

- administrar empleados;
- administrar servicios;
- administrar horarios;
- administrar citas;
- administrar usuarios internos;
- administrar configuración;
- consultar clientes;
- visualizar métricas;
- gestionar notificaciones.

## Manager

Puede:

- gestionar agenda;
- gestionar citas;
- gestionar clientes;
- gestionar servicios;
- gestionar empleados;
- gestionar horarios.

No puede administrar permisos de otros administradores salvo que el Plan Maestro indique lo contrario.

## Employee

Puede:

- ver sus propias citas;
- cambiar estado de sus citas;
- consultar información necesaria del cliente para prestar el servicio;
- gestionar parcialmente su disponibilidad si el negocio lo permite;
- recibir notificaciones Push.

No debe poder consultar información administrativa que no necesita.

---

# 7. Sitio público

Rutas previstas:

```text
/
/servicios
/servicios/:slug
/equipo
/galeria
/nosotros
/reservar
/reserva/:reference
/contacto
/privacidad
```

---

# 8. Home

Debe incluir:

## Header

- logo;
- navegación;
- botón "Reservar";
- horarios;
- menú móvil.

## Hero

- fotografía premium;
- propuesta de valor;
- CTA "Reservar cita";
- CTA secundario hacia servicios.

## Servicios

Tarjetas con:

- imagen;
- nombre;
- descripción;
- duración;
- precio;
- CTA.

Ejemplos:

- Manicure semipermanente.
- Pedicure Spa.
- Acrílicas.
- Gel.
- Nail Art.

## Galería

- grid responsive;
- trabajos realizados;
- lazy loading;
- visor de imagen.

## Equipo

- fotografía;
- nombre;
- especialidades;
- bio corta.

## Testimonios

Contenido configurable.

## Ubicación

- dirección;
- mapa;
- horarios;
- botón de WhatsApp.

## WhatsApp

Botón flotante global.

---

# 9. Flujo de reserva

Ruta:

```text
/reservar
```

Debe utilizar un Wizard.

Pasos:

```text
1. Servicios
2. Especialista
3. Fecha y hora
4. Datos
5. Confirmación
```

---

# 10. Paso 1 — Servicios

El usuario puede seleccionar uno o varios servicios compatibles.

Cada servicio muestra:

- nombre;
- descripción;
- duración;
- precio.

La interfaz muestra continuamente:

```text
Servicios seleccionados
Duración estimada total
Precio estimado total
```

Los cálculos del navegador son informativos.

El servidor debe recalcular:

- precio;
- duración;
- compatibilidad.

Nunca confiar en valores enviados por el navegador.

---

# 11. Paso 2 — Especialista

Opciones:

- especialista específico;
- "Cualquiera disponible".

Solo deben mostrarse empleados capaces de realizar todos los servicios seleccionados.

---

# 12. Paso 3 — Fecha y hora

La disponibilidad se calcula dinámicamente considerando:

- jornada del empleado;
- descansos;
- días libres;
- vacaciones;
- bloqueos;
- citas existentes;
- duración total;
- buffers;
- servicios compatibles;
- estado de otras citas.

No almacenar miles de slots prefabricados.

Calcular disponibilidad a partir de intervalos.

---

# 13. Paso 4 — Datos del cliente

Campos iniciales:

```text
Nombre
Teléfono
Email
Notas especiales
Aceptación de privacidad
```

El teléfono es obligatorio.

Email puede ser configurable como opcional.

Validar con Zod en cliente y nuevamente en servidor.

---

# 14. Paso 5 — Confirmación

Mostrar:

- código de reserva;
- servicios;
- especialista;
- fecha;
- hora;
- duración;
- precio;
- ubicación;
- acciones disponibles.

CTA:

- agregar al calendario;
- WhatsApp;
- volver al inicio.

Nunca exponer IDs internos mediante la URL pública.

Utilizar un `public_reference`.

---

# 15. Estados de una cita

Estados iniciales:

```text
pending
confirmed
in_progress
completed
cancelled
no_show
```

Traducción UI:

```text
Pendiente
Confirmada
En proceso
Completada
Cancelada
No asistió
```

---

# 16. Panel administrativo

Rutas:

```text
/admin/login

/admin
/admin/agenda
/admin/citas
/admin/clientes
/admin/empleados
/admin/servicios
/admin/horarios
/admin/notificaciones
/admin/configuracion
```

Todo `/admin/*`, excepto login, requiere autorización.

---

# 17. Dashboard

Mostrar inicialmente:

- citas de hoy;
- citas pendientes;
- citas completadas;
- próxima cita;
- ingresos estimados del día;
- últimos agendamientos.

No crear dashboards financieros complejos en MVP.

---

# 18. Agenda

FullCalendar.

Vistas:

- día;
- semana;
- mes.

Debe permitir:

- abrir cita;
- crear cita manual;
- cambiar estado;
- reprogramar;
- cancelar.

No implementar drag-and-drop de reprogramación hasta que exista validación server-side completa.

---

# 19. Citas manuales

Orígenes posibles:

```text
website
admin
phone
whatsapp
walk_in
```

Las mismas reglas anti-solapamiento deben aplicarse tanto a reservas públicas como a reservas creadas por staff.

---

# 20. Empleados

Cada empleado tendrá:

- nombre;
- apellido;
- fotografía;
- bio;
- teléfono interno;
- especialidades;
- servicios disponibles;
- sede;
- estado;
- disponible para reservas;
- comisión opcional.

---

# 21. Horarios

La disponibilidad de empleados debe soportar:

- jornada recurrente semanal;
- pausas;
- días libres;
- vacaciones;
- bloqueos puntuales.

No utilizar únicamente un campo:

```text
start_time
end_time
```

en `employees`.

---

# 22. Servicios

Cada servicio incluye:

- categoría;
- nombre;
- slug;
- descripción;
- precio;
- duración;
- buffer;
- imagen;
- activo/inactivo.

Puede existir personalización por empleado:

- duración especial;
- precio especial.

---

# 23. Clientes

Datos:

- nombre;
- teléfono;
- email;
- notas;
- consentimiento;
- fecha de creación.

El cliente no necesita cuenta en el MVP.

---

# 24. PWA

Objetivos:

- instalable;
- manifest válido;
- modo standalone;
- iconos adecuados;
- página offline básica;
- Push Notifications para empleados.

No debe implementarse:

- edición offline;
- sincronización offline;
- almacenamiento de agenda privada en caché.

---

# 25. Push

Ejemplo:

```text
¡Nueva cita agendada!

Cliente: María G.
Servicio: Manicure Spa
Hoy · 4:00 p. m.
```

Al tocar la notificación:

```text
/admin/citas/:id
```

o equivalente.

---

# 26. Realtime vs Push

Son mecanismos diferentes.

## Realtime

Cuando el dashboard está abierto:

```text
Nueva cita
→ Supabase Broadcast
→ UI se actualiza
```

## Push

Cuando la aplicación está cerrada:

```text
Nueva cita
→ notification_outbox
→ Edge Function
→ FCM
→ sistema operativo
```

Implementar ambos.

---

# 27. WhatsApp

Utilizar exclusivamente:

```text
WhatsApp Business Platform / Cloud API
```

Nunca:

- automatización de WhatsApp Web;
- Selenium;
- scripts de navegador;
- credenciales desde React.

Casos:

- confirmación;
- recordatorio;
- reprogramación;
- cancelación.

---

# 28. Email

Casos iniciales:

- confirmación;
- recordatorio;
- cancelación;
- reprogramación.

Las credenciales viven en servidor.

---

# 29. Estética

Dirección visual:

```text
moderna
sofisticada
minimalista
premium
femenina sin exceso
editorial
cálida
```

Paleta inicial:

```text
Background     #FBF8F6
Surface        #FFFFFF
Rose           #D7A899
Rose Dark      #B37C6E
Champagne      #D7C0A4
Stone          #292524
Muted          #78716C
Success        #5A8066
```

Puede ajustarse cuando exista identidad visual real.

No abusar:

- dorado;
- gradientes;
- animaciones;
- sombras;
- rosa saturado.

---

# 30. Tipografía

Propuesta:

Títulos:

```text
DM Serif Display
```

o equivalente.

Interfaz:

```text
Inter
```

No cargar muchas familias tipográficas.

---

# 31. Mobile First

Diseñar primero:

```text
375px
```

Luego validar:

```text
768px
1024px
1440px
```

La experiencia móvil es prioritaria.

---

# 32. Accesibilidad

Objetivo razonable:

```text
WCAG AA
```

Validar:

- contraste;
- labels;
- focus;
- navegación por teclado;
- alt text;
- jerarquía H1/H2/H3;
- mensajes de errores asociados;
- botones con labels accesibles.

---

# 33. SEO

Páginas públicas:

- title;
- description;
- canonical;
- Open Graph;
- sitemap;
- robots.txt.

No indexar:

```text
/admin/*
```

---

# 34. Seguridad

Reglas absolutas:

- RLS en tablas privadas;
- nunca exponer `service_role`;
- secretos solamente en servidor;
- Auth público deshabilitado si no es necesario;
- roles validados mediante funciones;
- toda operación pública sensible vía RPC o Edge Function;
- validaciones servidor;
- protección anti-spam;
- protección anti-rate-limit;
- protección contra doble reserva.

---

# 35. Fuera del MVP

No desarrollar inicialmente:

- pagos;
- POS;
- inventario;
- facturación electrónica;
- gift cards;
- membresías;
- programa de puntos;
- nómina;
- portal de clientes;
- app nativa;
- multiempresa;
- marketplace;
- contabilidad.

Preparar arquitectura para extenderse, pero no implementar estas funciones.

---

# 36. Regla de producto más importante

El núcleo del sistema es:

```text
DISPONIBILIDAD
+
RESERVAS
+
CONCURRENCIA
+
NOTIFICACIONES
```

Los CRUD son secundarios.

Nunca implementar una solución simplificada que permita doble reserva.
