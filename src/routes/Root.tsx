import { Outlet } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export function Root() {
  return (
    <div className="min-h-screen bg-zinc-900 font-sans text-gray-300">
      <Header />
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  )
}
