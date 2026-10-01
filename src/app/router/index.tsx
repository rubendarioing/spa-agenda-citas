import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <PlaceholderPage title="Inicio" /> },
      { path: 'servicios', element: <PlaceholderPage title="Servicios" /> },
      { path: 'servicios/:slug', element: <PlaceholderPage title="Detalle de servicio" /> },
      { path: 'equipo', element: <PlaceholderPage title="Equipo" /> },
      { path: 'galeria', element: <PlaceholderPage title="Galería" /> },
      { path: 'nosotros', element: <PlaceholderPage title="Nosotros" /> },
      { path: 'reservar', element: <PlaceholderPage title="Reservar" /> },
      { path: 'reserva/:reference', element: <PlaceholderPage title="Confirmación de reserva" /> },
      { path: 'contacto', element: <PlaceholderPage title="Contacto" /> },
      { path: 'privacidad', element: <PlaceholderPage title="Privacidad" /> },
    ],
  },
  {
    path: '/admin',
    children: [
      { path: 'login', element: <PlaceholderPage title="Admin · Login" /> },
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <PlaceholderPage title="Admin · Dashboard" /> },
          { path: 'agenda', element: <PlaceholderPage title="Admin · Agenda" /> },
          { path: 'citas', element: <PlaceholderPage title="Admin · Citas" /> },
          { path: 'clientes', element: <PlaceholderPage title="Admin · Clientes" /> },
          { path: 'empleados', element: <PlaceholderPage title="Admin · Empleados" /> },
          { path: 'servicios', element: <PlaceholderPage title="Admin · Servicios" /> },
          { path: 'horarios', element: <PlaceholderPage title="Admin · Horarios" /> },
          { path: 'notificaciones', element: <PlaceholderPage title="Admin · Notificaciones" /> },
          { path: 'configuracion', element: <PlaceholderPage title="Admin · Configuración" /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
