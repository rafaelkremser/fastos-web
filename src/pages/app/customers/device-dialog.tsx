import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { createDevice } from '@/api/create-device'
import { editDevice } from '@/api/edit-device'
import type { Device, DeviceBody } from '@/api/types'
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
import { DEVICE_TYPES, getDeviceTypeLabel } from '@/lib/device-types'

const deviceForm = z.object({
  type: z.string().min(1, 'Escolha o tipo do aparelho.'),
  brand: z.string().trim(),
  model: z.string().trim(),
  color: z.string().trim(),
  serialNumber: z.string().trim(),
  imei: z.string().trim(),
  condition: z.string().trim(),
  accessories: z.string().trim(),
  notes: z.string().trim(),
})

type DeviceForm = z.infer<typeof deviceForm>

function toBody(data: DeviceForm): DeviceBody {
  const orNull = (value: string) => value || null

  return {
    type: data.type,
    brand: orNull(data.brand),
    model: orNull(data.model),
    color: orNull(data.color),
    serialNumber: orNull(data.serialNumber),
    imei: orNull(data.imei),
    condition: orNull(data.condition),
    accessories: orNull(data.accessories),
    notes: orNull(data.notes),
  }
}

interface DeviceDialogProps {
  customerId: string
  // Edits this device; without it, creates a new one for the customer
  device?: Device
  onSaved: (device: Device) => void
}

// The content of a <Dialog>; the page that opens it keeps it open or closed
export function DeviceDialog({
  customerId,
  device,
  onSaved,
}: DeviceDialogProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DeviceForm>({
    resolver: zodResolver(deviceForm),
    defaultValues: {
      type: device?.type ?? '',
      brand: device?.brand ?? '',
      model: device?.model ?? '',
      color: device?.color ?? '',
      serialNumber: device?.serialNumber ?? '',
      imei: device?.imei ?? '',
      condition: device?.condition ?? '',
      accessories: device?.accessories ?? '',
      notes: device?.notes ?? '',
    },
  })

  const { mutateAsync: saveDevice } = useMutation({
    mutationFn: (body: DeviceBody) =>
      device
        ? editDevice({ deviceId: device.id, body })
        : createDevice({ customerId, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customer-devices', customerId],
      })
    },
  })

  async function handleSave(data: DeviceForm) {
    try {
      const saved = await saveDevice(toBody(data))

      toast.success(device ? 'Aparelho atualizado.' : 'Aparelho cadastrado.')
      onSaved(saved)
    } catch {
      toast.error('Não foi possível salvar o aparelho. Tente de novo.')
    }
  }

  // A type saved by another client stays selectable when editing
  const typeOptions =
    device && !DEVICE_TYPES.some((option) => option.value === device.type)
      ? [
          ...DEVICE_TYPES,
          { value: device.type, label: getDeviceTypeLabel(device.type) },
        ]
      : DEVICE_TYPES

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {device ? 'Editar aparelho' : 'Novo aparelho'}
        </DialogTitle>
        <DialogDescription>Só o tipo é obrigatório.</DialogDescription>
      </DialogHeader>

      <form
        id="device-form"
        onSubmit={handleSubmit(handleSave)}
        className="grid gap-4 sm:grid-cols-2"
      >
        <FormField label="Tipo" htmlFor="type" error={errors.type?.message}>
          <Controller
            name="type"
            control={control}
            render={({ field: { name, onChange, value } }) => (
              <Select name={name} value={value} onValueChange={onChange}>
                <SelectTrigger
                  id="type"
                  className="w-full"
                  aria-invalid={!!errors.type}
                >
                  <SelectValue placeholder="Escolha o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField label="Marca" htmlFor="brand">
          <Input id="brand" {...register('brand')} />
        </FormField>

        <FormField label="Modelo" htmlFor="model">
          <Input id="model" {...register('model')} />
        </FormField>

        <FormField label="Cor" htmlFor="color">
          <Input id="color" {...register('color')} />
        </FormField>

        <FormField label="Número de série" htmlFor="serialNumber">
          <Input id="serialNumber" {...register('serialNumber')} />
        </FormField>

        <FormField label="IMEI" htmlFor="imei">
          <Input id="imei" {...register('imei')} />
        </FormField>

        <FormField
          label="Estado do aparelho"
          htmlFor="condition"
          className="sm:col-span-2"
        >
          <Input
            id="condition"
            placeholder="Riscos na tampa, tela trincada no canto..."
            {...register('condition')}
          />
        </FormField>

        <FormField
          label="Acessórios entregues"
          htmlFor="accessories"
          className="sm:col-span-2"
        >
          <Input
            id="accessories"
            placeholder="Carregador, capinha..."
            {...register('accessories')}
          />
        </FormField>

        <FormField
          label="Observações"
          htmlFor="notes"
          className="sm:col-span-2"
        >
          <Textarea id="notes" {...register('notes')} />
        </FormField>
      </form>

      <DialogFooter>
        <Button type="submit" form="device-form" disabled={isSubmitting}>
          {device ? 'Salvar' : 'Cadastrar aparelho'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
