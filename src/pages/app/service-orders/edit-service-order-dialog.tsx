import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { editServiceOrder } from '@/api/edit-service-order'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { parseMoney, toDateInputValue, toMoneyInputValue } from '@/lib/format'
import { SERVICE_ORDER_PRIORITIES } from '@/lib/service-order'

import { updateServiceOrderCache } from './service-order-cache'

const money = z
  .string()
  .refine(
    (value) => value.trim() === '' || parseMoney(value) !== null,
    'Informe um valor como 150,00.',
  )

const editServiceOrderForm = z.object({
  problemDescription: z
    .string()
    .trim()
    .min(10, 'Descreva o problema com pelo menos 10 caracteres.'),
  diagnosis: z.string().trim(),
  solution: z.string().trim(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  estimatedDate: z.string(),
  estimatedCost: money,
  finalCost: money,
  discount: money,
  internalNotes: z.string().trim(),
  customerNotes: z.string().trim(),
})

type EditServiceOrderForm = z.infer<typeof editServiceOrderForm>

interface EditServiceOrderDialogProps {
  serviceOrder: ServiceOrder
  onDone: () => void
}

// The content of a <Dialog>. The technician has its own dialog
export function EditServiceOrderDialog(props: EditServiceOrderDialogProps) {
  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <EditServiceOrderDialogContent {...props} />
    </DialogContent>
  )
}

// Inside <DialogContent>, which is only mounted while the dialog is open, so
// each opening starts over from the current data
function EditServiceOrderDialogContent({
  serviceOrder,
  onDone,
}: EditServiceOrderDialogProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditServiceOrderForm>({
    resolver: zodResolver(editServiceOrderForm),
    defaultValues: {
      problemDescription: serviceOrder.problemDescription,
      diagnosis: serviceOrder.diagnosis ?? '',
      solution: serviceOrder.solution ?? '',
      priority: serviceOrder.priority,
      estimatedDate: toDateInputValue(serviceOrder.estimatedDate),
      estimatedCost: toMoneyInputValue(serviceOrder.estimatedCost),
      finalCost: toMoneyInputValue(serviceOrder.finalCost),
      discount: serviceOrder.discount
        ? toMoneyInputValue(serviceOrder.discount)
        : '',
      internalNotes: serviceOrder.internalNotes ?? '',
      customerNotes: serviceOrder.customerNotes ?? '',
    },
  })

  const { mutateAsync: edit } = useMutation({
    mutationFn: editServiceOrder,
    onSuccess: (updated) => updateServiceOrderCache(queryClient, updated),
  })

  async function handleSave(data: EditServiceOrderForm) {
    try {
      await edit({
        serviceOrderId: serviceOrder.id,
        body: {
          problemDescription: data.problemDescription,
          diagnosis: data.diagnosis || null,
          solution: data.solution || null,
          priority: data.priority,
          estimatedDate: data.estimatedDate || null,
          estimatedCost: parseMoney(data.estimatedCost),
          finalCost: parseMoney(data.finalCost),
          discount: parseMoney(data.discount) ?? 0,
          internalNotes: data.internalNotes || null,
          customerNotes: data.customerNotes || null,
        },
      })

      toast.success('OS atualizada.')
      onDone()
    } catch {
      toast.error('Não foi possível salvar a OS. Tente de novo.')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar OS nº {serviceOrder.number}</DialogTitle>
        <DialogDescription>
          Diagnóstico, solução, prazos e valores. Com valor final, ele substitui
          a soma dos itens no total; sem ele, vale o orçamento.
        </DialogDescription>
      </DialogHeader>

      <form
        id="edit-service-order-form"
        onSubmit={handleSubmit(handleSave)}
        className="grid gap-4 sm:grid-cols-2"
      >
        <FormField
          label="Problema relatado"
          htmlFor="problemDescription"
          error={errors.problemDescription?.message}
          className="sm:col-span-2"
        >
          <Textarea
            id="problemDescription"
            aria-invalid={!!errors.problemDescription}
            {...register('problemDescription')}
          />
        </FormField>

        <FormField
          label="Diagnóstico"
          htmlFor="diagnosis"
          className="sm:col-span-2"
        >
          <Textarea id="diagnosis" {...register('diagnosis')} />
        </FormField>

        <FormField label="Solução" htmlFor="solution" className="sm:col-span-2">
          <Textarea id="solution" {...register('solution')} />
        </FormField>

        <FormField label="Prioridade" htmlFor="priority">
          <Controller
            name="priority"
            control={control}
            render={({ field: { name, onChange, value } }) => (
              <Select name={name} value={value} onValueChange={onChange}>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_ORDER_PRIORITIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField label="Previsão de entrega" htmlFor="estimatedDate">
          <Input
            id="estimatedDate"
            type="date"
            {...register('estimatedDate')}
          />
        </FormField>

        <FormField
          label="Orçamento (R$)"
          htmlFor="estimatedCost"
          error={errors.estimatedCost?.message}
        >
          <Input
            id="estimatedCost"
            inputMode="decimal"
            placeholder="0,00"
            aria-invalid={!!errors.estimatedCost}
            {...register('estimatedCost')}
          />
        </FormField>

        <FormField
          label="Valor final (R$)"
          htmlFor="finalCost"
          error={errors.finalCost?.message}
        >
          <Input
            id="finalCost"
            inputMode="decimal"
            placeholder="0,00"
            aria-invalid={!!errors.finalCost}
            {...register('finalCost')}
          />
        </FormField>

        <FormField
          label="Desconto (R$)"
          htmlFor="discount"
          error={errors.discount?.message}
        >
          <Input
            id="discount"
            inputMode="decimal"
            placeholder="0,00"
            aria-invalid={!!errors.discount}
            {...register('discount')}
          />
        </FormField>

        <FormField
          label="Observações internas"
          htmlFor="internalNotes"
          className="sm:col-span-2"
        >
          <Textarea
            id="internalNotes"
            placeholder="Só a equipe vê"
            {...register('internalNotes')}
          />
        </FormField>

        <FormField
          label="Observações para o cliente"
          htmlFor="customerNotes"
          className="sm:col-span-2"
        >
          <Textarea id="customerNotes" {...register('customerNotes')} />
        </FormField>
      </form>

      <DialogFooter>
        <Button
          type="submit"
          form="edit-service-order-form"
          disabled={isSubmitting}
        >
          Salvar
        </Button>
      </DialogFooter>
    </>
  )
}
