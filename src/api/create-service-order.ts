import { api } from '@/lib/axios'

import type { ServiceOrder, ServiceOrderPriority } from './types'

export interface CreateServiceOrderBody {
  customerId: string
  deviceId: string
  problemDescription: string
  priority: ServiceOrderPriority
  // A day, as "2026-10-30"
  estimatedDate: string | null
  internalNotes: string | null
}

export async function createServiceOrder({
  estimatedDate,
  internalNotes,
  ...body
}: CreateServiceOrderBody) {
  // The API takes these as optional, not as null
  const response = await api.post<{ serviceOrder: ServiceOrder }>(
    '/service-orders',
    {
      ...body,
      ...(estimatedDate && { estimatedDate }),
      ...(internalNotes && { internalNotes }),
    },
  )

  return response.data.serviceOrder
}
