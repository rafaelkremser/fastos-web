import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { changeUserRole } from '@/api/change-user-role'
import type { User, UserRole } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getErrorStatus } from '@/lib/api-error'
import { getAssignableRoles, ROLE_LABELS } from '@/lib/roles'

type AssignableRole = Exclude<UserRole, 'OWNER'>

interface RoleDialogProps {
  user: User
  // Decides which roles can be given
  managerRole: UserRole | undefined
  onDone: () => void
}

// The content of a <Dialog>
export function RoleDialog(props: RoleDialogProps) {
  return (
    <DialogContent>
      <RoleDialogContent {...props} />
    </DialogContent>
  )
}

// Inside <DialogContent>, which is only mounted while the dialog is open, so
// each opening starts from the person's current role
function RoleDialogContent({ user, managerRole, onDone }: RoleDialogProps) {
  const queryClient = useQueryClient()
  const roles = getAssignableRoles(managerRole)
  // Only someone with one of these roles gets this dialog
  const [role, setRole] = useState(user.role as AssignableRole)

  const { mutateAsync: changeRole, isPending } = useMutation({
    mutationFn: changeUserRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  async function handleSave() {
    try {
      await changeRole({ userId: user.id, role })
      toast.success(`${user.name} agora é ${ROLE_LABELS[role].toLowerCase()}.`)
      onDone()
    } catch (error) {
      toast.error(
        getErrorStatus(error) === 403
          ? 'Você não pode dar esse papel a essa pessoa.'
          : 'Não foi possível mudar o papel. Tente de novo.',
      )
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Mudar o papel de {user.name}</DialogTitle>
        <DialogDescription>
          O novo papel vale em até 15 minutos, quando a loja dessa pessoa
          renovar o acesso.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="new-role">Papel</Label>
        <Select
          value={role}
          onValueChange={(value) => setRole(value as AssignableRole)}
        >
          <SelectTrigger id="new-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((option) => (
              <SelectItem key={option} value={option}>
                {ROLE_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button disabled={isPending || role === user.role} onClick={handleSave}>
          Salvar
        </Button>
      </DialogFooter>
    </>
  )
}
