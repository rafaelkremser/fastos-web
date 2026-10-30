import { ClipboardList, House, IdCard, Users, Wrench } from 'lucide-react'

import { AccountMenu } from './account-menu'
import { NavLink } from './nav-link'
import { ThemeToggle } from './theme/theme-toggle'
import { Separator } from './ui/separator'

export function Header() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Wrench className="hidden size-6 sm:block" />

        {/* The separator stretches to the full height by default; here it is
            a short line centered by the logo */}
        <Separator
          orientation="vertical"
          className="hidden h-6 sm:block data-vertical:self-center"
        />

        {/* Phones and tablets get only the icons: the four labels and the
            store's name only fit in one line on wider screens */}
        <nav className="flex items-center lg:space-x-2 xl:space-x-6">
          <NavLink to="/">
            <House className="size-4" />
            <span className="max-lg:sr-only">Início</span>
          </NavLink>
          <NavLink to="/service-orders">
            <ClipboardList className="size-4" />
            <span className="max-lg:sr-only">Ordens de serviço</span>
          </NavLink>
          <NavLink to="/customers">
            <Users className="size-4" />
            <span className="max-lg:sr-only">Clientes</span>
          </NavLink>
          <NavLink to="/team">
            <IdCard className="size-4" />
            <span className="max-lg:sr-only">Equipe</span>
          </NavLink>
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          <ThemeToggle />
          <AccountMenu />
        </div>
      </div>
    </div>
  )
}
