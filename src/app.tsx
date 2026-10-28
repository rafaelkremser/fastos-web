import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'

import { ThemeProvider } from '@/components/theme/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/react-query'
import { getCurrentTenantSlug } from '@/lib/tenant'

import { createRouter } from './routes'

const router = createRouter(getCurrentTenantSlug())

export function App() {
  return (
    <ThemeProvider storageKey="fastos-theme" defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
  )
}
