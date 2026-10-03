create type public.user_role as enum ('admin', 'manager', 'employee');

create type public.appointment_status as enum (
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
);

create type public.appointment_source as enum (
  'website', 'admin', 'phone', 'whatsapp', 'walk_in'
);

create type public.notification_channel as enum ('push', 'email', 'whatsapp');

create type public.notification_status as enum (
  'pending', 'processing', 'sent', 'failed'
);
