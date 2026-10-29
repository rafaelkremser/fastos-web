import { api } from '@/lib/axios'

import type { ServiceOrder, ServiceOrderStatus } from './types'

export interface ChangeServiceOrderStatusParams {
  serviceOrderId: string
  status: ServiceOrderStatus
  // Shown in the history instead of the generic description
  notes?: string
}

export async function changeServiceOrderStatus({
  serviceOrderId,
  status,
  notes,
}: ChangeServiceOrderStatusParams) {
  const response = await api.patch<{ serviceOrder: ServiceOrder }>(
    `/service-orders/${serviceOrderId}/status`,
    { status, ...(notes && { notes }) },
  )

  return response.data.serviceOrder
}
