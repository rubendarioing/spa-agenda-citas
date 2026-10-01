import { Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
