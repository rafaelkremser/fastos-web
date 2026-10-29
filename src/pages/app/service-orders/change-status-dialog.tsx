import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { changeServiceOrderStatus } from '@/api/change-service-order-status'
import type { ServiceOrder, ServiceOrderStatus } from '@/api/types'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  getNextStatus,
  getStatusLabel,
  SERVICE_ORDER_STATUSES,
} from '@/lib/service-order'

import { updateServiceOrderCache } from './service-order-cache'

interface ChangeStatusDialogProps {
  serviceOrder: ServiceOrder
  onDone: () => void
}

// The content of a <Dialog>. Any status can be chosen; the usual next step
// comes selected
export function ChangeStatusDialog({
  serviceOrder,
  onDone,
}: ChangeStatusDialogProps) {
  const queryClient = useQueryClient()

  const changeStatusForm = z.object({
    status: z
      .string()
      .refine(
        (status) => status !== serviceOrder.status,
        'Escolha um status diferente do atual.',
      ),
    notes: z.string().trim(),
  })

  type ChangeStatusForm = z.infer<typeof changeStatusForm>

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ChangeStatusForm>({
    resolver: zodResolver(changeStatusForm),
    defaultValues: {
      status: getNextStatus(serviceOrder.status) ?? serviceOrder.status,
      notes: '',
    },
  })

  const { mutateAsync: changeStatus } = useMutation({
    mutationFn: changeServiceOrderStatus,
    onSuccess: (updated) => updateServiceOrderCache(queryClient, updated),
  })

  async function handleChangeStatus({ status, notes }: ChangeStatusForm) {
    try {
      await changeStatus({
        serviceOrderId: serviceOrder.id,
        status: status as ServiceOrderStatus,
        notes: notes || undefined,
      })

      toast.success(`OS agora está como "${getStatusLabel(status)}".`)
      onDone()
    } catch {
      toast.error('Não foi possível mudar o status. Tente de novo.')
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Mudar status</DialogTitle>
        <DialogDescription>
          Hoje a OS está como "{getStatusLabel(serviceOrder.status)}".
        </DialogDescription>
      </DialogHeader>

      <form
        id="change-status-form"
        onSubmit={handleSubmit(handleChangeStatus)}
        className="space-y-4"
      >
        <FormField
          label="Novo status"
          htmlFor="status"
          error={errors.status?.message}
        >
          <Controller
            name="status"
            control={control}
            render={({ field: { name, onChange, value } }) => (
              <Select name={name} value={value} onValueChange={onChange}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_ORDER_STATUSES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField label="Observação (opcional)" htmlFor="notes">
          <Textarea
            id="notes"
            placeholder="Aparece no histórico da OS"
            {...register('notes')}
          />
        </FormField>
      </form>

      <DialogFooter>
        <Button type="submit" form="change-status-form" disabled={isSubmitting}>
          Mudar status
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
