import { Wrench } from 'lucide-react'
import { Outlet } from 'react-router'

const currentYear = new Date().getFullYear()

export function AuthLayout() {
  return (
    <div className="grid min-h-screen antialiased md:grid-cols-2">
      <div className="hidden h-full flex-col justify-between border-r border-foreground/5 bg-muted p-10 text-muted-foreground md:flex">
        <div className="flex items-center gap-3 text-lg font-medium text-foreground">
          <Wrench className="size-5" />
          <span className="font-semibold">FastOS</span>
        </div>
        <footer className="text-sm">FastOS &copy; {currentYear}</footer>
      </div>

      <div className="relative flex flex-col items-center justify-center">
        <Outlet />
      </div>
    </div>
  )
}
