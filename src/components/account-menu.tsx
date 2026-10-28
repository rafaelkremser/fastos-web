import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, LogOut } from 'lucide-react'

import { getTenant } from '@/api/get-tenant'
import type { UserRole } from '@/api/get-user'
import { useCurrentUser } from '@/hooks/use-current-user'
import { endSession } from '@/lib/session'

import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Skeleton } from './ui/skeleton'

const roleLabels: Record<UserRole, string> = {
  OWNER: 'Dono',
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  RECEPTIONIST: 'Atendente',
}

export function AccountMenu() {
  const queryClient = useQueryClient()

  const { data: tenant, isLoading: isLoadingTenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: getTenant,
    staleTime: Infinity,
  })

  const { data: user, isLoading: isLoadingUser } = useCurrentUser()

  // The API keeps no session to close, so signing out is forgetting the
  // tokens. The panel then sends the person to the sign-in page
  function handleSignOut() {
    endSession()
    queryClient.clear()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex min-w-0 items-center gap-2 select-none"
        >
          {isLoadingTenant ? (
            <Skeleton className="h-4 w-24 sm:w-40" />
          ) : (
            <span className="max-w-32 truncate sm:max-w-60">
              {tenant?.name}
            </span>
          )}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          {isLoadingUser ? (
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : (
            user && (
              <>
                <span>{user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {roleLabels[user.role]}
                </span>
              </>
            )
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOut />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
