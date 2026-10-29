import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRightLeft,
  BellRing,
  MessageCircle,
  Pencil,
  UserCog,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { getCustomer } from '@/api/get-customer'
import { getDevice } from '@/api/get-device'
import { getServiceOrder } from '@/api/get-service-order'
import { getTenant } from '@/api/get-tenant'
import { PageTitle } from '@/components/page-title'
import { ServiceOrderStatus } from '@/components/service-order-status'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useTeam } from '@/hooks/use-team'
import { buildNoticeMessage, buildWhatsAppLink } from '@/lib/customer-notice'
import { describeDevice } from '@/lib/device-types'
import {
  formatDate,
  formatDateTime,
  formatDay,
  formatMoney,
  formatPhone,
} from '@/lib/format'
import { canAssignTechnician, canEditServiceOrders } from '@/lib/permissions'
import { getPriorityLabel } from '@/lib/service-order'

import { AssignTechnicianDialog } from './assign-technician-dialog'
import { ChangeStatusDialog } from './change-status-dialog'
import { CustomerNoticeDialog } from './customer-notice-dialog'
import { EditServiceOrderDialog } from './edit-service-order-dialog'
import { ServiceOrderHistory } from './service-order-history'
import { ServiceOrderItems } from './service-order-items'

type OpenDialog = 'status' | 'technician' | 'edit' | 'notice' | null

export function ServiceOrderDetails() {
  const { serviceOrderId = '' } = useParams()
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)

  const { data: user } = useCurrentUser()
  const { getName } = useTeam()

  const { data: serviceOrder, isError } = useQuery({
    queryKey: ['service-order', serviceOrderId],
    queryFn: () => getServiceOrder(serviceOrderId),
    retry: false,
  })

  const { data: customer } = useQuery({
    queryKey: ['customer', serviceOrder?.customerId],
    queryFn: () => getCustomer(serviceOrder!.customerId),
    enabled: !!serviceOrder,
  })

  const { data: device } = useQuery({
    queryKey: ['device', serviceOrder?.deviceId],
    queryFn: () => getDevice(serviceOrder!.deviceId),
    enabled: !!serviceOrder,
  })

  // The store's name goes in the WhatsApp message
  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: getTenant,
    staleTime: Infinity,
  })

  // The API answers 404 for an unknown order and 403 for another store's
  if (isError) {
    return (
      <div className="flex flex-col items-start gap-2">
        <PageTitle title="OS não encontrada" />
        <h1 className="text-3xl font-bold tracking-tight">OS não encontrada</h1>
        <Link to="/service-orders" className="text-sky-500 dark:text-sky-400">
          Voltar para as ordens de serviço
        </Link>
      </div>
    )
  }

  if (!serviceOrder) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const canEdit = canEditServiceOrders(user?.role)
  const canAssign = canAssignTechnician(user?.role)

  function dialogProps(dialog: Exclude<OpenDialog, null>) {
    return {
      open: openDialog === dialog,
      onOpenChange: (open: boolean) => setOpenDialog(open ? dialog : null),
    }
  }

  const closeDialog = () => setOpenDialog(null)
  const openNoticeDialog = () => setOpenDialog('notice')

  // Null while the customer, the device or the store is loading, and when the
  // phone is not one WhatsApp could use
  const whatsAppLink =
    customer && device && tenant
      ? buildWhatsAppLink(
          customer.phone,
          buildNoticeMessage({
            status: serviceOrder.status,
            number: serviceOrder.number,
            storeName: tenant.name,
            customerName: customer.name,
            device,
            total: serviceOrder.totalWithDiscount,
          }),
        )
      : null

  const summary = [
    {
      label: 'Cliente',
      value: customer && (
        <Link to={`/customers/${customer.id}`} className="hover:underline">
          {customer.name}
        </Link>
      ),
    },
    { label: 'Telefone', value: customer && formatPhone(customer.phone) },
    { label: 'Aparelho', value: device && describeDevice(device) },
    {
      label: 'Cor e identificação',
      value:
        device &&
        [device.color, device.imei ?? device.serialNumber]
          .filter(Boolean)
          .join(' · '),
    },
    { label: 'Estado na entrada', value: device?.condition },
    { label: 'Acessórios', value: device?.accessories },
    {
      label: 'Técnico',
      value: getName(serviceOrder.technicianId) ?? 'Sem técnico',
    },
    { label: 'Prioridade', value: getPriorityLabel(serviceOrder.priority) },
    {
      label: 'Aviso ao cliente',
      value: serviceOrder.needsCustomerNotice
        ? 'Ainda não avisado'
        : serviceOrder.customerNotifiedAt &&
          `Avisado em ${formatDateTime(serviceOrder.customerNotifiedAt)}`,
    },
    { label: 'Entrada', value: formatDate(serviceOrder.entryDate) },
    {
      label: 'Previsão de entrega',
      value:
        serviceOrder.estimatedDate && formatDay(serviceOrder.estimatedDate),
    },
    {
      label: 'Pronta em',
      value:
        serviceOrder.completedDate && formatDate(serviceOrder.completedDate),
    },
    {
      label: 'Entregue em',
      value:
        serviceOrder.deliveredDate && formatDate(serviceOrder.deliveredDate),
    },
    {
      label: 'Garantia',
      value: serviceOrder.warrantyUntil
        ? `Até ${formatDay(serviceOrder.warrantyUntil)}`
        : `${serviceOrder.warrantyDays} dias depois da entrega`,
    },
    {
      label: 'Orçamento',
      value:
        serviceOrder.estimatedCost !== null &&
        formatMoney(serviceOrder.estimatedCost),
    },
    {
      label: 'Valor final',
      value:
        serviceOrder.finalCost !== null && formatMoney(serviceOrder.finalCost),
    },
  ]

  const texts = [
    { label: 'Problema relatado', value: serviceOrder.problemDescription },
    { label: 'Diagnóstico', value: serviceOrder.diagnosis },
    { label: 'Solução', value: serviceOrder.solution },
    { label: 'Observações internas', value: serviceOrder.internalNotes },
    { label: 'Observações para o cliente', value: serviceOrder.customerNotes },
  ].filter((text) => text.value)

  return (
    <>
      <PageTitle title={`OS nº ${serviceOrder.number}`} />
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Link
            to="/service-orders"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Ordens de serviço
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight">
                OS nº {serviceOrder.number}
              </h1>
              <ServiceOrderStatus status={serviceOrder.status} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Dialog {...dialogProps('status')}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <ArrowRightLeft className="size-4" />
                    Mudar status
                  </Button>
                </DialogTrigger>
                <ChangeStatusDialog
                  serviceOrder={serviceOrder}
                  onDone={closeDialog}
                />
              </Dialog>

              {/* While the callout below is up, its button does this */}
              {!serviceOrder.needsCustomerNotice && (
                <Button variant="outline" size="sm" onClick={openNoticeDialog}>
                  <BellRing className="size-4" />
                  Registrar aviso
                </Button>
              )}

              {canAssign && (
                <Dialog {...dialogProps('technician')}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserCog className="size-4" />
                      Técnico
                    </Button>
                  </DialogTrigger>
                  <AssignTechnicianDialog
                    serviceOrder={serviceOrder}
                    onDone={closeDialog}
                  />
                </Dialog>
              )}

              {canEdit && (
                <Dialog {...dialogProps('edit')}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Pencil className="size-4" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <EditServiceOrderDialog
                    serviceOrder={serviceOrder}
                    onDone={closeDialog}
                  />
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {serviceOrder.needsCustomerNotice && (
          <section
            aria-label="Aviso ao cliente"
            className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
          >
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">
                {serviceOrder.status === 'COMPLETED'
                  ? 'Pronta: falta avisar o cliente para retirar.'
                  : 'Orçamento pronto: falta avisar o cliente para aprovar.'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Depois de avisar, registre aqui para a OS sair da lista "Precisa
                avisar".
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {whatsAppLink && (
                // Opens WhatsApp with the message written, and leaves the
                // dialog waiting here to record it
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={whatsAppLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={openNoticeDialog}
                  >
                    <MessageCircle className="size-4" />
                    Abrir WhatsApp
                  </a>
                </Button>
              )}
              <Button size="sm" onClick={openNoticeDialog}>
                <BellRing className="size-4" />
                Registrar aviso
              </Button>
            </div>
          </section>
        )}

        <dl className="grid gap-4 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium">
                {value === undefined ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  value || '—'
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-4 md:grid-cols-2">
          {texts.map(({ label, value }) => (
            <div key={label} className="space-y-1 rounded-md border p-4">
              <h2 className="text-sm text-muted-foreground">{label}</h2>
              <p className="text-sm whitespace-pre-line">{value}</p>
            </div>
          ))}
        </div>

        <ServiceOrderItems serviceOrder={serviceOrder} canEdit={canEdit} />

        <ServiceOrderHistory serviceOrderId={serviceOrder.id} />
      </div>

      <Dialog {...dialogProps('notice')}>
        <CustomerNoticeDialog
          serviceOrder={serviceOrder}
          onDone={closeDialog}
        />
      </Dialog>
    </>
  )
}
