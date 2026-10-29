import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { deleteCustomer } from '@/api/delete-customer'
import { getCustomer } from '@/api/get-customer'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { PageTitle } from '@/components/page-title'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getErrorStatus } from '@/lib/api-error'
import { formatAddress, formatDate, formatPhone } from '@/lib/format'
import { canDeleteRecords } from '@/lib/permissions'

import { CustomerDevices } from './customer-devices'
import { CustomerDialog } from './customer-dialog'
import { CustomerServiceOrders } from './customer-service-orders'

export function CustomerDetails() {
  const { customerId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  const { data: user } = useCurrentUser()
  const canDelete = canDeleteRecords(user?.role)

  const { data: customer, isError } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => getCustomer(customerId),
    retry: false,
  })

  const { mutate: deleteCustomerFn, isPending: isDeleting } = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success('Cliente excluído.')
      // Removing the customer's own query here would make this page, still on
      // screen, fetch it again and get a 404
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      navigate('/customers', { replace: true })
    },
    onError: (error) => {
      toast.error(
        getErrorStatus(error) === 409
          ? 'Este cliente tem ordens de serviço e não pode ser excluído.'
          : 'Não foi possível excluir o cliente. Tente de novo.',
      )
    },
  })

  // The API answers 404 for an unknown customer and 403 for another store's
  if (isError) {
    return (
      <div className="flex flex-col items-start gap-2">
        <PageTitle title="Cliente não encontrado" />
        <h1 className="text-3xl font-bold tracking-tight">
          Cliente não encontrado
        </h1>
        <Link to="/customers" className="text-sky-500 dark:text-sky-400">
          Voltar para os clientes
        </Link>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const details = [
    { label: 'Telefone', value: formatPhone(customer.phone) },
    {
      label: 'Outro telefone',
      value: customer.phone2 && formatPhone(customer.phone2),
    },
    { label: 'E-mail', value: customer.email },
    { label: 'CPF ou CNPJ', value: customer.document },
    { label: 'Endereço', value: formatAddress(customer) },
    { label: 'Cliente desde', value: formatDate(customer.createdAt) },
  ]

  return (
    <>
      <PageTitle title={customer.name} />
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Link
            to="/customers"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Clientes
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">
              {customer.name}
            </h1>

            <div className="flex gap-2">
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Pencil className="size-4" />
                    Editar
                  </Button>
                </DialogTrigger>

                <CustomerDialog
                  customer={customer}
                  onSaved={() => setIsEditing(false)}
                />
              </Dialog>

              {canDelete && (
                <ConfirmDeleteDialog
                  title="Excluir cliente?"
                  description={`${customer.name} e os aparelhos dele serão excluídos. Clientes com ordens de serviço não podem ser excluídos.`}
                  isDeleting={isDeleting}
                  onConfirm={() => deleteCustomerFn(customer.id)}
                  trigger={
                    <Button variant="destructive" size="sm">
                      <Trash2 className="size-4" />
                      Excluir
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </div>

        <dl className="grid gap-4 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-3">
          {details.map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium">{value || '—'}</dd>
            </div>
          ))}

          {customer.notes && (
            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
              <dt className="text-sm text-muted-foreground">Observações</dt>
              <dd className="text-sm whitespace-pre-line">{customer.notes}</dd>
            </div>
          )}
        </dl>

        <CustomerServiceOrders customerId={customer.id} />

        <CustomerDevices customerId={customer.id} canDelete={canDelete} />
      </div>
    </>
  )
}
