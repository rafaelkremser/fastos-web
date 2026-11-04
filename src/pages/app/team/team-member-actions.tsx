import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, UserCheck, UserCog, UserX } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { setUserActive } from '@/api/set-user-active'
import type { User, UserRole } from '@/api/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getErrorStatus } from '@/lib/api-error'

import { RoleDialog } from './role-dialog'

interface TeamMemberActionsProps {
  user: User
  managerRole: UserRole | undefined
}

// The menu on the row of someone the person looking may manage
export function TeamMemberActions({
  user,
  managerRole,
}: TeamMemberActionsProps) {
  const queryClient = useQueryClient()
  // The menu closes as it opens one of these, so they live outside it
  const [openDialog, setOpenDialog] = useState<'role' | 'deactivate' | null>(
    null,
  )

  const { mutateAsync: setActive, isPending } = useMutation({
    mutationFn: setUserActive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  async function handleSetActive(isActive: boolean) {
    try {
      await setActive({ userId: user.id, isActive })
      toast.success(
        isActive
          ? `${user.name} voltou a ter acesso à loja.`
          : `${user.name} não tem mais acesso à loja.`,
      )
      setOpenDialog(null)
    } catch (error) {
      toast.error(
        getErrorStatus(error) === 403
          ? 'Você não pode mudar o acesso dessa pessoa.'
          : 'Não foi possível mudar o acesso. Tente de novo.',
      )
    }
  }

  function closeUnless(dialog: typeof openDialog) {
    return (open: boolean) => setOpenDialog(open ? dialog : null)
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Ações para {user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setOpenDialog('role')}>
            <UserCog />
            Mudar papel
          </DropdownMenuItem>
          {user.isActive ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setOpenDialog('deactivate')}
            >
              <UserX />
              Desativar acesso
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={isPending}
              onSelect={() => handleSetActive(true)}
            >
              <UserCheck />
              Reativar acesso
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openDialog === 'role'} onOpenChange={closeUnless('role')}>
        <RoleDialog
          user={user}
          managerRole={managerRole}
          onDone={() => setOpenDialog(null)}
        />
      </Dialog>

      <AlertDialog
        open={openDialog === 'deactivate'}
        onOpenChange={closeUnless('deactivate')}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              A pessoa não consegue mais entrar, e quem estiver com a loja
              aberta sai em até 15 minutos. As OS e o histórico dela continuam,
              e dá para reativar depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={(event) => {
                // Stays open if it fails, to show the error
                event.preventDefault()
                handleSetActive(false)
              }}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
