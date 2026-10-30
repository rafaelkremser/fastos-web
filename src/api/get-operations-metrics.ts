import { api } from '@/lib/axios'

import type { ServiceOrderStatus } from './types'

export interface OperationsMetrics {
  // Every status, the empty ones with zero
  byStatus: Record<ServiceOrderStatus, number>
  // From "Aberta" to "Aguardando peças"
  active: number
  // Active and past the due day
  late: number
  readyForPickup: number
  needsCustomerNotice: number
}

// How the store's work stands right now; every role sees it
export async function getOperationsMetrics() {
  const response = await api.get<{ metrics: OperationsMetrics }>(
    '/metrics/operations',
  )

  return response.data.metrics
}
