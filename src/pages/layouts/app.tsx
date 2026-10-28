import { Navigate, Outlet } from 'react-router'

import { Header } from '@/components/header'
import { useSession } from '@/hooks/use-session'

export function AppLayout() {
  const isSignedIn = useSession()

  // Also covers the session ending while the panel is open: signing out, or
  // the API refusing to renew the token
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  return (
    <div className="flex min-h-screen flex-col antialiased">
      <Header />

      <div className="flex flex-1 flex-col gap-4 p-8 pt-6">
        <Outlet />
      </div>
    </div>
  )
}
