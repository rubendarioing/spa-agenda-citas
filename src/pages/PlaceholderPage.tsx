type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-gray-600">Próximamente.</p>
    </section>
  )
}
