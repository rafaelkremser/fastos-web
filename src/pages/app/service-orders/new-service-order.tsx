import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { createServiceOrder } from '@/api/create-service-order'
import { fetchCustomerDevices } from '@/api/fetch-customer-devices'
import { fetchCustomers } from '@/api/fetch-customers'
import { getCustomer } from '@/api/get-customer'
import type { Customer } from '@/api/types'
import { FormField } from '@/components/form-field'
import { PageTitle } from '@/components/page-title'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { describeDevice } from '@/lib/device-types'
import { formatPhone } from '@/lib/format'
import { SERVICE_ORDER_PRIORITIES } from '@/lib/service-order'
import { cn } from '@/lib/utils'

import { DeviceDialog } from '../customers/device-dialog'

const serviceOrderForm = z.object({
  deviceId: z.string().min(1, 'Escolha o aparelho.'),
  problemDescription: z
    .string()
    .trim()
    .min(10, 'Descreva o problema com pelo menos 10 caracteres.'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  estimatedDate: z.string(),
  internalNotes: z.string().trim(),
})

type ServiceOrderForm = z.infer<typeof serviceOrderForm>

// Opening an order: who brought it, which device, and what is wrong. From a
// customer's page the customer (and maybe the device) comes in the address
export function NewServiceOrder() {
  const [searchParams] = useSearchParams()
  const [customerId, setCustomerId] = useState(
    searchParams.get('customerId') ?? '',
  )

  return (
    <>
      <PageTitle title="Nova OS" />
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="space-y-2">
          <Link
            to="/service-orders"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Ordens de serviço
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Nova OS</h1>
        </div>

        {customerId ? (
          <ServiceOrderDetailsForm
            customerId={customerId}
            initialDeviceId={searchParams.get('deviceId') ?? ''}
            onChangeCustomer={() => setCustomerId('')}
          />
        ) : (
          <CustomerPicker onPick={(customer) => setCustomerId(customer.id)} />
        )}
      </div>
    </>
  )
}

function CustomerPicker({ onPick }: { onPick: (customer: Customer) => void }) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())

  const { data: result, isFetching } = useQuery({
    queryKey: ['customers', 1, debouncedSearch],
    queryFn: () => fetchCustomers({ page: 1, search: debouncedSearch }),
    enabled: debouncedSearch.length >= 2,
  })

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">1. Cliente</h2>

      <div className="relative">
        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          autoFocus
          aria-label="Buscar cliente pelo nome"
          placeholder="Digite o nome do cliente"
          className="pl-8"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {debouncedSearch.length >= 2 && (
        <div className="rounded-md border">
          {isFetching && !result && (
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {result?.customers.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">
              Nenhum cliente com esse nome.{' '}
              <Link to="/customers" className="underline">
                Cadastre o cliente
              </Link>{' '}
              e volte aqui.
            </p>
          )}

          <ul className="divide-y">
            {result?.customers.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => onPick(customer)}
                  className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="font-medium">{customer.name}</span>
                  <span className="text-muted-foreground">
                    {formatPhone(customer.phone)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

interface ServiceOrderDetailsFormProps {
  customerId: string
  initialDeviceId: string
  onChangeCustomer: () => void
}

function ServiceOrderDetailsForm({
  customerId,
  initialDeviceId,
  onChangeCustomer,
}: ServiceOrderDetailsFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreatingDevice, setIsCreatingDevice] = useState(false)

  const { data: customer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => getCustomer(customerId),
  })

  const { data: devices } = useQuery({
    queryKey: ['customer-devices', customerId, 1],
    queryFn: () => fetchCustomerDevices({ customerId, page: 1 }),
    select: (result) => result.devices,
  })

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceOrderForm>({
    resolver: zodResolver(serviceOrderForm),
    defaultValues: {
      deviceId: initialDeviceId,
      problemDescription: '',
      priority: 'NORMAL',
      estimatedDate: '',
      internalNotes: '',
    },
  })

  const { mutateAsync: createServiceOrderFn } = useMutation({
    mutationFn: createServiceOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
    },
  })

  async function handleCreate(data: ServiceOrderForm) {
    try {
      const serviceOrder = await createServiceOrderFn({
        customerId,
        deviceId: data.deviceId,
        problemDescription: data.problemDescription,
        priority: data.priority,
        estimatedDate: data.estimatedDate || null,
        internalNotes: data.internalNotes || null,
      })

      toast.success(`OS nº ${serviceOrder.number} aberta.`)
      navigate(`/service-orders/${serviceOrder.id}`)
    } catch {
      toast.error('Não foi possível abrir a OS. Tente de novo.')
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(handleCreate)} className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Cliente</h2>
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            {customer ? (
              <div>
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatPhone(customer.phone)}
                </div>
              </div>
            ) : (
              <Skeleton className="h-9 w-48" />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onChangeCustomer}
            >
              <X className="size-4" />
              Trocar
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">2. Aparelho</h2>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingDevice(true)}
            >
              <Plus className="size-4" />
              Novo aparelho
            </Button>
          </div>

          {!devices && <Skeleton className="h-12 w-full" />}

          {devices?.length === 0 && (
            <p className="rounded-md border p-3 text-sm text-muted-foreground">
              Este cliente ainda não tem aparelho. Cadastre o aparelho que veio
              para o conserto.
            </p>
          )}

          <Controller
            name="deviceId"
            control={control}
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-label="Aparelho"
                className="grid gap-2 sm:grid-cols-2"
              >
                {devices?.map((device) => (
                  <button
                    key={device.id}
                    type="button"
                    role="radio"
                    aria-checked={field.value === device.id}
                    onClick={() => field.onChange(device.id)}
                    className={cn(
                      'rounded-md border p-3 text-left text-sm transition-colors hover:bg-muted',
                      field.value === device.id &&
                        'border-primary ring-2 ring-primary/30',
                    )}
                  >
                    <div className="font-medium">{describeDevice(device)}</div>
                    <div className="text-muted-foreground">
                      {[device.color, device.imei ?? device.serialNumber]
                        .filter(Boolean)
                        .join(' · ') || 'Sem cor nem identificação'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          />
          {errors.deviceId && (
            <p className="text-sm text-destructive">
              {errors.deviceId.message}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">3. Problema</h2>

          <FormField
            label="O que o cliente relatou"
            htmlFor="problemDescription"
            error={errors.problemDescription?.message}
          >
            <Textarea
              id="problemDescription"
              aria-invalid={!!errors.problemDescription}
              placeholder="Não liga, tela trincada, bateria descarregando rápido..."
              {...register('problemDescription')}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <FormField label="Observações internas" htmlFor="internalNotes">
            <Textarea
              id="internalNotes"
              placeholder="Só a equipe vê"
              {...register('internalNotes')}
            />
          </FormField>
        </section>

        <Button type="submit" disabled={isSubmitting}>
          Abrir OS
        </Button>
      </form>

      {/* Outside the form on purpose: React carries a submit inside a dialog up
        to every form around it, even through the portal, so saving the device
        would also try to open the order */}
      <Dialog open={isCreatingDevice} onOpenChange={setIsCreatingDevice}>
        <DeviceDialog
          customerId={customerId}
          onSaved={(device) => {
            setIsCreatingDevice(false)
            setValue('deviceId', device.id, { shouldValidate: true })
          }}
        />
      </Dialog>
    </>
  )
}
