import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { addServiceOrderItem } from '@/api/add-service-order-item'
import { removeServiceOrderItem } from '@/api/remove-service-order-item'
import type { ServiceOrder, ServiceOrderItem } from '@/api/types'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatMoney, parseMoney } from '@/lib/format'
import {
  getItemTypeLabel,
  getTotalLines,
  ITEM_TYPES,
} from '@/lib/service-order'
import { cn } from '@/lib/utils'

interface ServiceOrderItemsProps {
  serviceOrder: ServiceOrder
  canEdit: boolean
}

export function ServiceOrderItems({
  serviceOrder,
  canEdit,
}: ServiceOrderItemsProps) {
  const [isAdding, setIsAdding] = useState(false)
  const totalLines = getTotalLines(serviceOrder)

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Peças e serviços
        </h2>

        {canEdit && (
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="size-4" />
                Adicionar item
              </Button>
            </DialogTrigger>

            <AddItemDialog
              serviceOrderId={serviceOrder.id}
              onDone={() => setIsAdding(false)}
            />
          </Dialog>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[96px]">Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[64px] text-right">Qtd.</TableHead>
              <TableHead className="hidden w-[120px] text-right sm:table-cell">
                Valor unitário
              </TableHead>
              <TableHead className="w-[120px] text-right">Total</TableHead>
              {canEdit && <TableHead className="w-[48px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {serviceOrder.items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 6 : 5}
                  className="py-6 text-center text-muted-foreground"
                >
                  Nenhuma peça ou serviço lançado ainda.
                </TableCell>
              </TableRow>
            )}

            {serviceOrder.items.map((item) => (
              <ItemRow
                key={item.id}
                serviceOrderId={serviceOrder.id}
                item={item}
                canEdit={canEdit}
              />
            ))}
          </TableBody>
          {(serviceOrder.items.length > 0 || totalLines.length > 1) && (
            <TableFooter>
              {totalLines.map((line) => (
                <TableRow key={line.label}>
                  <TableCell
                    colSpan={4}
                    className={cn(line.isTotal && 'font-semibold')}
                  >
                    {line.label}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right',
                      line.isTotal && 'font-semibold',
                    )}
                  >
                    {line.value}
                  </TableCell>
                  {canEdit && <TableCell />}
                </TableRow>
              ))}
            </TableFooter>
          )}
        </Table>
      </div>
    </section>
  )
}

interface ItemRowProps {
  serviceOrderId: string
  item: ServiceOrderItem
  canEdit: boolean
}

function ItemRow({ serviceOrderId, item, canEdit }: ItemRowProps) {
  const queryClient = useQueryClient()

  const { mutate: removeItem, isPending } = useMutation({
    mutationFn: removeServiceOrderItem,
    onSuccess: () => {
      toast.success('Item removido.')
      queryClient.invalidateQueries({
        queryKey: ['service-order', serviceOrderId],
      })
    },
    onError: () => {
      toast.error('Não foi possível remover o item. Tente de novo.')
    },
  })

  return (
    <TableRow>
      <TableCell className="text-muted-foreground">
        {getItemTypeLabel(item.type)}
      </TableCell>
      <TableCell className="font-medium">{item.description}</TableCell>
      <TableCell className="text-right">{item.quantity}</TableCell>
      <TableCell className="hidden text-right sm:table-cell">
        {formatMoney(item.unitPrice)}
      </TableCell>
      <TableCell className="text-right">
        {formatMoney(item.totalPrice)}
      </TableCell>
      {canEdit && (
        <TableCell>
          <ConfirmDeleteDialog
            title="Remover item?"
            description={`"${item.description}" sai da OS.`}
            confirmLabel="Remover"
            isDeleting={isPending}
            onConfirm={() => removeItem({ serviceOrderId, itemId: item.id })}
            trigger={
              <Button variant="ghost" size="icon-sm">
                <Trash2 className="size-4" />
                <span className="sr-only">Remover {item.description}</span>
              </Button>
            }
          />
        </TableCell>
      )}
    </TableRow>
  )
}

const addItemForm = z.object({
  type: z.enum(['SERVICE', 'PART', 'OTHER']),
  description: z.string().trim().min(1, 'Descreva o item.'),
  quantity: z.coerce
    .number<string>()
    .int('Use um número inteiro.')
    .min(1, 'A quantidade mínima é 1.'),
  unitPrice: z
    .string()
    .refine(
      (value) => parseMoney(value) !== null,
      'Informe um valor como 150,00.',
    ),
})

type AddItemFormInput = z.input<typeof addItemForm>
type AddItemForm = z.output<typeof addItemForm>

interface AddItemDialogProps {
  serviceOrderId: string
  onDone: () => void
}

function AddItemDialog(props: AddItemDialogProps) {
  return (
    <DialogContent>
      <AddItemDialogContent {...props} />
    </DialogContent>
  )
}

// Inside <DialogContent>, which is only mounted while the dialog is open, so
// each opening starts over from the current data
function AddItemDialogContent({ serviceOrderId, onDone }: AddItemDialogProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddItemFormInput, unknown, AddItemForm>({
    resolver: zodResolver(addItemForm),
    defaultValues: {
      type: 'SERVICE',
      description: '',
      quantity: '1',
      unitPrice: '',
    },
  })

  const { mutateAsync: addItem } = useMutation({
    mutationFn: addServiceOrderItem,
    // The totals are the API's to calculate, so the order is fetched again
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['service-order', serviceOrderId],
      }),
  })

  async function handleAdd(data: AddItemForm) {
    try {
      await addItem({
        serviceOrderId,
        item: {
          type: data.type,
          description: data.description,
          quantity: data.quantity,
          unitPrice: parseMoney(data.unitPrice) ?? 0,
        },
      })

      toast.success('Item adicionado.')
      onDone()
    } catch {
      toast.error('Não foi possível adicionar o item. Tente de novo.')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Adicionar item</DialogTitle>
        <DialogDescription>
          Uma peça trocada ou um serviço feito, com o valor cobrado.
        </DialogDescription>
      </DialogHeader>

      <form
        id="add-item-form"
        onSubmit={handleSubmit(handleAdd)}
        className="grid gap-4 sm:grid-cols-2"
      >
        <FormField label="Tipo" htmlFor="type">
          <Controller
            name="type"
            control={control}
            render={({ field: { name, onChange, value } }) => (
              <Select name={name} value={value} onValueChange={onChange}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField
          label="Quantidade"
          htmlFor="quantity"
          error={errors.quantity?.message}
        >
          <Input
            id="quantity"
            type="number"
            min={1}
            aria-invalid={!!errors.quantity}
            {...register('quantity')}
          />
        </FormField>

        <FormField
          label="Descrição"
          htmlFor="description"
          error={errors.description?.message}
          className="sm:col-span-2"
        >
          <Input
            id="description"
            placeholder="Troca de tela, bateria original..."
            aria-invalid={!!errors.description}
            {...register('description')}
          />
        </FormField>

        <FormField
          label="Valor unitário (R$)"
          htmlFor="unitPrice"
          error={errors.unitPrice?.message}
        >
          <Input
            id="unitPrice"
            inputMode="decimal"
            placeholder="0,00"
            aria-invalid={!!errors.unitPrice}
            {...register('unitPrice')}
          />
        </FormField>
      </form>

      <DialogFooter>
        <Button type="submit" form="add-item-form" disabled={isSubmitting}>
          Adicionar
        </Button>
      </DialogFooter>
    </>
  )
}
