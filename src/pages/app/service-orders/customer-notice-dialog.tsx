import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { registerCustomerNotice } from '@/api/register-customer-notice'
import type { ServiceOrder } from '@/api/types'
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
import { NOTICE_CHANNELS } from '@/lib/customer-notice'

import { updateServiceOrderCache } from './service-order-cache'

const customerNoticeForm = z.object({
  channel: z.enum(['WHATSAPP', 'PHONE', 'SMS', 'EMAIL', 'IN_PERSON']),
  notes: z.string().trim(),
})

type CustomerNoticeForm = z.infer<typeof customerNoticeForm>

interface CustomerNoticeDialogProps {
  serviceOrder: ServiceOrder
  onDone: () => void
}

// The content of a <Dialog>. Records that the customer was told, so the order
// leaves the "Precisa avisar" list; the history keeps the channel and note
export function CustomerNoticeDialog({
  serviceOrder,
  onDone,
}: CustomerNoticeDialogProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<CustomerNoticeForm>({
    resolver: zodResolver(customerNoticeForm),
    defaultValues: { channel: 'WHATSAPP', notes: '' },
  })

  const { mutateAsync: registerNotice } = useMutation({
    mutationFn: registerCustomerNotice,
    onSuccess: (updated) => updateServiceOrderCache(queryClient, updated),
  })

  async function handleRegisterNotice({ channel, notes }: CustomerNoticeForm) {
    try {
      await registerNotice({
        serviceOrderId: serviceOrder.id,
        channel,
        notes: notes || undefined,
      })

      toast.success('Aviso registrado.')
      onDone()
    } catch {
      toast.error('Não foi possível registrar o aviso. Tente de novo.')
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Registrar aviso</DialogTitle>
        <DialogDescription>
          Anote que o cliente foi avisado sobre a OS nº {serviceOrder.number}.
        </DialogDescription>
      </DialogHeader>

      <form
        id="customer-notice-form"
        onSubmit={handleSubmit(handleRegisterNotice)}
        className="space-y-4"
      >
        <FormField label="Como avisou" htmlFor="channel">
          <Controller
            name="channel"
            control={control}
            render={({ field: { name, onChange, value } }) => (
              <Select name={name} value={value} onValueChange={onChange}>
                <SelectTrigger id="channel" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTICE_CHANNELS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField label="Observação (opcional)" htmlFor="notice-notes">
          <Textarea
            id="notice-notes"
            placeholder="Ex.: vai buscar amanhã à tarde"
            {...register('notes')}
          />
        </FormField>
      </form>

      <DialogFooter>
        <Button
          type="submit"
          form="customer-notice-form"
          disabled={isSubmitting}
        >
          Registrar aviso
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
