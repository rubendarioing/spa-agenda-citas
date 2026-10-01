import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="p-6 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-gray-600">La página que buscas no existe.</p>
      <Link to="/" className="mt-4 inline-block text-blue-600 underline">
        Volver al inicio
      </Link>
    </section>
  )
}
