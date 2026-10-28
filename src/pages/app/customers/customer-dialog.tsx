import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { createCustomer } from '@/api/create-customer'
import { editCustomer } from '@/api/edit-customer'
import type { Customer, CustomerBody } from '@/api/types'
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
import { Textarea } from '@/components/ui/textarea'
import { getErrorStatus } from '@/lib/api-error'
import { formatPhone, onlyDigits } from '@/lib/format'

function hasAreaCode(phone: string) {
  return phone.length === 10 || phone.length === 11
}

// Phones are sent with digits only, so the same number typed with or without
// punctuation is the same number for the API's duplicate check
const customerForm = z.object({
  name: z.string().trim().min(2, 'Informe o nome do cliente.'),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine(hasAreaCode, 'Informe o telefone com DDD.'),
  phone2: z
    .string()
    .transform(onlyDigits)
    .refine(
      (phone) => phone === '' || hasAreaCode(phone),
      'Informe o telefone com DDD.',
    ),
  email: z.union([z.literal(''), z.email('Informe um e-mail válido.')]),
  document: z.string().trim(),
  zipCode: z.string().trim(),
  address: z.string().trim(),
  addressNumber: z.string().trim(),
  complement: z.string().trim(),
  neighborhood: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim().toUpperCase(),
  notes: z.string().trim(),
})

type CustomerFormInput = z.input<typeof customerForm>
type CustomerForm = z.output<typeof customerForm>

function toBody(data: CustomerForm): CustomerBody {
  const orNull = (value: string) => value || null

  return {
    name: data.name,
    phone: data.phone,
    phone2: orNull(data.phone2),
    email: orNull(data.email),
    document: orNull(data.document),
    zipCode: orNull(data.zipCode),
    address: orNull(data.address),
    addressNumber: orNull(data.addressNumber),
    complement: orNull(data.complement),
    neighborhood: orNull(data.neighborhood),
    city: orNull(data.city),
    state: orNull(data.state),
    notes: orNull(data.notes),
  }
}

interface CustomerDialogProps {
  // Edits this customer; without it, creates a new one
  customer?: Customer
  onSaved: (customer: Customer) => void
}

// The content of a <Dialog>; the page that opens it keeps it open or closed
export function CustomerDialog({ customer, onSaved }: CustomerDialogProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormInput, unknown, CustomerForm>({
    resolver: zodResolver(customerForm),
    defaultValues: {
      name: customer?.name ?? '',
      phone: customer ? formatPhone(customer.phone) : '',
      phone2: customer?.phone2 ? formatPhone(customer.phone2) : '',
      email: customer?.email ?? '',
      document: customer?.document ?? '',
      zipCode: customer?.zipCode ?? '',
      address: customer?.address ?? '',
      addressNumber: customer?.addressNumber ?? '',
      complement: customer?.complement ?? '',
      neighborhood: customer?.neighborhood ?? '',
      city: customer?.city ?? '',
      state: customer?.state ?? '',
      notes: customer?.notes ?? '',
    },
  })

  const { mutateAsync: saveCustomer } = useMutation({
    mutationFn: (body: CustomerBody) =>
      customer
        ? editCustomer({ customerId: customer.id, body })
        : createCustomer(body),
    onSuccess: (saved) => {
      queryClient.setQueryData(['customer', saved.id], saved)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })

  async function handleSave(data: CustomerForm) {
    try {
      const saved = await saveCustomer(toBody(data))

      toast.success(customer ? 'Cliente atualizado.' : 'Cliente cadastrado.')
      onSaved(saved)
    } catch (error) {
      if (getErrorStatus(error) === 409) {
        setError('phone', {
          message: 'Já existe um cliente com esse telefone.',
        })
      } else {
        toast.error('Não foi possível salvar o cliente. Tente de novo.')
      }
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {customer ? 'Editar cliente' : 'Novo cliente'}
        </DialogTitle>
        <DialogDescription>
          Só o nome e o telefone são obrigatórios.
        </DialogDescription>
      </DialogHeader>

      <form
        id="customer-form"
        onSubmit={handleSubmit(handleSave)}
        className="grid gap-4 sm:grid-cols-2"
      >
        <FormField
          label="Nome"
          htmlFor="name"
          error={errors.name?.message}
          className="sm:col-span-2"
        >
          <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
        </FormField>

        <FormField
          label="Telefone"
          htmlFor="phone"
          error={errors.phone?.message}
        >
          <Input
            id="phone"
            type="tel"
            placeholder="(11) 98765-4321"
            aria-invalid={!!errors.phone}
            {...register('phone')}
          />
        </FormField>

        <FormField
          label="Outro telefone"
          htmlFor="phone2"
          error={errors.phone2?.message}
        >
          <Input
            id="phone2"
            type="tel"
            aria-invalid={!!errors.phone2}
            {...register('phone2')}
          />
        </FormField>

        <FormField label="E-mail" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField label="CPF ou CNPJ" htmlFor="document">
          <Input id="document" {...register('document')} />
        </FormField>

        <FormField label="CEP" htmlFor="zipCode">
          <Input id="zipCode" {...register('zipCode')} />
        </FormField>

        <FormField label="Rua" htmlFor="address">
          <Input id="address" {...register('address')} />
        </FormField>

        <FormField label="Número" htmlFor="addressNumber">
          <Input id="addressNumber" {...register('addressNumber')} />
        </FormField>

        <FormField label="Complemento" htmlFor="complement">
          <Input id="complement" {...register('complement')} />
        </FormField>

        <FormField label="Bairro" htmlFor="neighborhood">
          <Input id="neighborhood" {...register('neighborhood')} />
        </FormField>

        <div className="grid grid-cols-[1fr_5rem] gap-4">
          <FormField label="Cidade" htmlFor="city">
            <Input id="city" {...register('city')} />
          </FormField>

          <FormField label="UF" htmlFor="state">
            <Input id="state" maxLength={2} {...register('state')} />
          </FormField>
        </div>

        <FormField
          label="Observações"
          htmlFor="notes"
          className="sm:col-span-2"
        >
          <Textarea id="notes" {...register('notes')} />
        </FormField>
      </form>

      <DialogFooter>
        <Button type="submit" form="customer-form" disabled={isSubmitting}>
          {customer ? 'Salvar' : 'Cadastrar cliente'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
