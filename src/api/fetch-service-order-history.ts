import { api } from '@/lib/axios'

import type { ServiceOrderHistoryEntry } from './types'

export async function fetchServiceOrderHistory(serviceOrderId: string) {
  const response = await api.get<{ history: ServiceOrderHistoryEntry[] }>(
    `/service-orders/${serviceOrderId}/history`,
  )

  return response.data.history
}
