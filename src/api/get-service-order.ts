import { api } from '@/lib/axios'

import type { ServiceOrder } from './types'

export async function getServiceOrder(serviceOrderId: string) {
  const response = await api.get<{ serviceOrder: ServiceOrder }>(
    `/service-orders/${serviceOrderId}`,
  )

  return response.data.serviceOrder
}
