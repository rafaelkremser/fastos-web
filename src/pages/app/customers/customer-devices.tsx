import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { deleteDevice } from '@/api/delete-device'
import { fetchCustomerDevices } from '@/api/fetch-customer-devices'
import type { Device } from '@/api/types'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Pagination } from '@/components/pagination'
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
import { getErrorStatus } from '@/lib/api-error'
import { describeDevice } from '@/lib/device-types'

import { DeviceDialog } from './device-dialog'

interface CustomerDevicesProps {
  customerId: string
  canDelete: boolean
}

export function CustomerDevices({
  customerId,
  canDelete,
}: CustomerDevicesProps) {
  const [page, setPage] = useState(1)
  const [isCreating, setIsCreating] = useState(false)

  const { data: result } = useQuery({
    queryKey: ['customer-devices', customerId, page],
    queryFn: () => fetchCustomerDevices({ customerId, page }),
    placeholderData: keepPreviousData,
  })

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Aparelhos</h2>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="size-4" />
              Novo aparelho
            </Button>
          </DialogTrigger>

          <DeviceDialog
            customerId={customerId}
            onSaved={() => setIsCreating(false)}
          />
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aparelho</TableHead>
              <TableHead className="hidden md:table-cell">
                Nº de série / IMEI
              </TableHead>
              <TableHead className="hidden lg:table-cell">Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Acessórios</TableHead>
              <TableHead className="w-[96px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!result && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            )}

            {result?.devices.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum aparelho cadastrado para este cliente.
                </TableCell>
              </TableRow>
            )}

            {result?.devices.map((device) => (
              <DeviceRow
                key={device.id}
                customerId={customerId}
                device={device}
                canDelete={canDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {result && result.meta.totalCount > result.meta.perPage && (
        <Pagination
          page={result.meta.page}
          perPage={result.meta.perPage}
          totalCount={result.meta.totalCount}
          onPageChange={setPage}
        />
      )}
    </section>
  )
}

interface DeviceRowProps {
  customerId: string
  device: Device
  canDelete: boolean
}

function DeviceRow({ customerId, device, canDelete }: DeviceRowProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  const { mutate: deleteDeviceFn, isPending: isDeleting } = useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      toast.success('Aparelho excluído.')
      queryClient.invalidateQueries({
        queryKey: ['customer-devices', customerId],
      })
    },
    onError: (error) => {
      toast.error(
        getErrorStatus(error) === 409
          ? 'Este aparelho tem ordens de serviço e não pode ser excluído.'
          : 'Não foi possível excluir o aparelho. Tente de novo.',
      )
    },
  })

  const identifiers = [device.serialNumber, device.imei]
    .filter(Boolean)
    .join(' / ')

  return (
    <TableRow>
      <TableCell className="font-medium">
        {describeDevice(device)}
        {device.color && (
          <span className="font-normal text-muted-foreground">
            {' '}
            · {device.color}
          </span>
        )}
      </TableCell>
      <TableCell className="hidden font-mono text-xs md:table-cell">
        {identifiers}
      </TableCell>
      <TableCell className="hidden text-muted-foreground lg:table-cell">
        {device.condition}
      </TableCell>
      <TableCell className="hidden text-muted-foreground lg:table-cell">
        {device.accessories}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Pencil className="size-4" />
                <span className="sr-only">Editar aparelho</span>
              </Button>
            </DialogTrigger>

            <DeviceDialog
              customerId={customerId}
              device={device}
              onSaved={() => setIsEditing(false)}
            />
          </Dialog>

          {canDelete && (
            <ConfirmDeleteDialog
              title="Excluir aparelho?"
              description={`${describeDevice(device)} será excluído. Aparelhos com ordens de serviço não podem ser excluídos.`}
              isDeleting={isDeleting}
              onConfirm={() => deleteDeviceFn(device.id)}
              trigger={
                <Button variant="ghost" size="icon-sm">
                  <Trash2 className="size-4" />
                  <span className="sr-only">Excluir aparelho</span>
                </Button>
              }
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
