import type {
  ServiceOrder,
  ServiceOrderItemType,
  ServiceOrderPriority,
  ServiceOrderStatus,
} from '@/api/types'

import { formatMoney } from './format'

// In the order an order usually goes through them
export const SERVICE_ORDER_STATUSES: {
  value: ServiceOrderStatus
  label: string
  // Tailwind class of the dot next to the label
  color: string
}[] = [
  { value: 'OPEN', label: 'Aberta', color: 'bg-slate-400' },
  { value: 'IN_ANALYSIS', label: 'Em análise', color: 'bg-sky-500' },
  {
    value: 'WAITING_APPROVAL',
    label: 'Aguardando aprovação',
    color: 'bg-amber-500',
  },
  { value: 'APPROVED', label: 'Aprovada', color: 'bg-indigo-500' },
  { value: 'IN_PROGRESS', label: 'Em reparo', color: 'bg-blue-500' },
  { value: 'WAITING_PARTS', label: 'Aguardando peças', color: 'bg-orange-500' },
  { value: 'COMPLETED', label: 'Pronta', color: 'bg-emerald-500' },
  { value: 'DELIVERED', label: 'Entregue', color: 'bg-teal-600' },
  { value: 'CANCELLED', label: 'Cancelada', color: 'bg-rose-500' },
]

export function getStatusLabel(status: string) {
  return (
    SERVICE_ORDER_STATUSES.find((option) => option.value === status)?.label ??
    status
  )
}

// The usual next step, offered first when changing the status. Delivered and
// cancelled orders have none
const NEXT_STATUS: Partial<Record<ServiceOrderStatus, ServiceOrderStatus>> = {
  OPEN: 'IN_ANALYSIS',
  IN_ANALYSIS: 'WAITING_APPROVAL',
  WAITING_APPROVAL: 'APPROVED',
  APPROVED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  WAITING_PARTS: 'IN_PROGRESS',
  COMPLETED: 'DELIVERED',
}

export function getNextStatus(status: ServiceOrderStatus) {
  return NEXT_STATUS[status] ?? null
}

export const SERVICE_ORDER_PRIORITIES: {
  value: ServiceOrderPriority
  label: string
}[] = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
]

export function getPriorityLabel(priority: ServiceOrderPriority) {
  return (
    SERVICE_ORDER_PRIORITIES.find((option) => option.value === priority)
      ?.label ?? priority
  )
}

export const ITEM_TYPES: { value: ServiceOrderItemType; label: string }[] = [
  { value: 'SERVICE', label: 'Serviço' },
  { value: 'PART', label: 'Peça' },
  { value: 'OTHER', label: 'Outro' },
]

export function getItemTypeLabel(type: ServiceOrderItemType) {
  return ITEM_TYPES.find((option) => option.value === type)?.label ?? type
}

// The API charges the final amount when there is one, else the quote, else
// the items; the discount comes off whichever it is. The footer shows which,
// so the total never looks like a wrong sum of the items
export function getTotalLines(serviceOrder: ServiceOrder) {
  const lines: { label: string; value: string; isTotal?: boolean }[] = []

  if (serviceOrder.finalCost !== null) {
    lines.push({
      label: 'Valor final (é ele que vale no total)',
      value: formatMoney(serviceOrder.finalCost),
    })
  } else if (serviceOrder.estimatedCost !== null) {
    lines.push({
      label: 'Orçamento (é ele que vale no total)',
      value: formatMoney(serviceOrder.estimatedCost),
    })
  }

  if (serviceOrder.discount > 0) {
    lines.push({
      label: 'Desconto',
      value: `− ${formatMoney(serviceOrder.discount)}`,
    })
  }

  // With nothing between them, the sum of the items would repeat the total
  if (lines.length > 0 && serviceOrder.items.length > 0) {
    lines.unshift({
      label: 'Soma dos itens',
      value: formatMoney(serviceOrder.totalItemsCost),
    })
  }

  lines.push({
    label: 'Total',
    value: formatMoney(serviceOrder.totalWithDiscount),
    isTotal: true,
  })

  return lines
}
