import { UserPlus } from 'lucide-react'

import { PageTitle } from '@/components/page-title'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useTeam } from '@/hooks/use-team'
import { formatDate } from '@/lib/format'
import { canCreateUsers } from '@/lib/permissions'
import { ROLE_LABELS } from '@/lib/roles'

import { UserDialog } from './user-dialog'

// Everyone sees the team; owners and admins add people to it
export function Team() {
  const { data: currentUser } = useCurrentUser()
  const { data: users } = useTeam()

  return (
    <>
      <PageTitle title="Equipe" />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>

          {canCreateUsers(currentUser?.role) && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="size-4" />
                  Novo usuário
                </Button>
              </DialogTrigger>
              <UserDialog creatorRole={currentUser?.role} />
            </Dialog>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">E-mail</TableHead>
                <TableHead className="w-[140px]">Papel</TableHead>
                <TableHead className="hidden w-[120px] sm:table-cell">
                  Na equipe desde
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!users &&
                Array.from({ length: 4 }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {users?.map((user) => (
                <TableRow
                  key={user.id}
                  className={
                    user.isActive ? undefined : 'text-muted-foreground'
                  }
                >
                  <TableCell>
                    <span className="font-medium">{user.name}</span>
                    {user.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (você)
                      </span>
                    )}
                    {!user.isActive && (
                      <span className="ml-2 text-xs font-medium">Inativo</span>
                    )}
                    {/* On phones the e-mail column is hidden */}
                    <div className="text-xs text-muted-foreground md:hidden">
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell>{ROLE_LABELS[user.role]}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {formatDate(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
