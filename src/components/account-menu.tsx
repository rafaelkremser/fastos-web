import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, LogOut } from 'lucide-react'

import { getTenant } from '@/api/get-tenant'
import { getUser, type UserRole } from '@/api/get-user'
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

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
    staleTime: Infinity,
  })

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
          className="flex items-center gap-2 select-none"
        >
          {isLoadingTenant ? <Skeleton className="h-4 w-40" /> : tenant?.name}
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
