import { api } from '@/lib/axios'

import type { ServiceOrder, ServiceOrderPriority } from './types'

// The technician is left out on purpose: assigning one has its own route,
// which only owners and admins may call and which records it in the history
export interface EditServiceOrderBody {
  problemDescription: string
  diagnosis: string | null
  solution: string | null
  priority: ServiceOrderPriority
  // A day, as "2026-10-30"
  estimatedDate: string | null
  estimatedCost: number | null
  finalCost: number | null
  discount: number
  internalNotes: string | null
  customerNotes: string | null
}

export interface EditServiceOrderParams {
  serviceOrderId: string
  body: EditServiceOrderBody
}

export async function editServiceOrder({
  serviceOrderId,
  body,
}: EditServiceOrderParams) {
  const response = await api.put<{ serviceOrder: ServiceOrder }>(
    `/service-orders/${serviceOrderId}`,
    body,
  )

  return response.data.serviceOrder
}
