import { Link } from 'react-router'

import type { ServiceOrderSummary } from '@/api/types'
import { describeDevice } from '@/lib/device-types'
import { formatDate, formatDay, formatPhone } from '@/lib/format'
import { getPriorityLabel } from '@/lib/service-order'

import { ServiceOrderStatus } from './service-order-status'
import { Skeleton } from './ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

interface ServiceOrdersTableProps {
  // Still loading while undefined
  serviceOrders: ServiceOrderSummary[] | undefined
  emptyMessage: string
  // Off on a customer's own page, where every order is theirs
  showCustomer?: boolean
}

export function ServiceOrdersTable({
  serviceOrders,
  emptyMessage,
  showCustomer = true,
}: ServiceOrdersTableProps) {
  const columns = showCustomer ? 7 : 6

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[88px]">Nº</TableHead>
            {showCustomer && <TableHead>Cliente</TableHead>}
            <TableHead className="hidden md:table-cell">Aparelho</TableHead>
            <TableHead className="w-[200px]">Status</TableHead>
            <TableHead className="hidden lg:table-cell">Técnico</TableHead>
            <TableHead className="hidden w-[110px] sm:table-cell">
              Entrada
            </TableHead>
            <TableHead className="hidden w-[110px] lg:table-cell">
              Previsão
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!serviceOrders &&
            Array.from({ length: 5 }, (_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={columns}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ))}

          {serviceOrders?.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns}
                className="py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}

          {serviceOrders?.map((serviceOrder) => (
            <TableRow key={serviceOrder.id}>
              <TableCell className="font-medium">
                <Link
                  to={`/service-orders/${serviceOrder.id}`}
                  className="font-mono hover:underline"
                >
                  {serviceOrder.number}
                </Link>
                {(serviceOrder.priority === 'HIGH' ||
                  serviceOrder.priority === 'URGENT') && (
                  <span className="ml-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                    {getPriorityLabel(serviceOrder.priority)}
                  </span>
                )}
              </TableCell>
              {showCustomer && (
                <TableCell>
                  <div className="font-medium">
                    {serviceOrder.customer.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPhone(serviceOrder.customer.phone)}
                  </div>
                </TableCell>
              )}
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {describeDevice(serviceOrder.device)}
              </TableCell>
              <TableCell>
                <ServiceOrderStatus status={serviceOrder.status} />
                {serviceOrder.needsCustomerNotice && (
                  <div className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    Avisar cliente
                  </div>
                )}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {serviceOrder.technician?.name ?? '—'}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatDate(serviceOrder.entryDate)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {serviceOrder.estimatedDate
                  ? formatDay(serviceOrder.estimatedDate)
                  : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
