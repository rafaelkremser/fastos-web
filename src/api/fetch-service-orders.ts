import { api } from '@/lib/axios'

import type {
  PaginationMeta,
  ServiceOrderStatus,
  ServiceOrderSummary,
} from './types'

export interface FetchServiceOrdersQuery {
  page: number
  number?: number | null
  status?: ServiceOrderStatus | null
  technicianId?: string | null
  customerId?: string | null
  needsCustomerNotice?: boolean
}

export interface FetchServiceOrdersResponse {
  serviceOrders: ServiceOrderSummary[]
  meta: PaginationMeta
}

export async function fetchServiceOrders({
  page,
  number,
  status,
  technicianId,
  customerId,
  needsCustomerNotice,
}: FetchServiceOrdersQuery) {
  const response = await api.get<FetchServiceOrdersResponse>(
    '/service-orders',
    {
      params: {
        page,
        number: number || undefined,
        status: status || undefined,
        technicianId: technicianId || undefined,
        customerId: customerId || undefined,
        needsCustomerNotice: needsCustomerNotice || undefined,
      },
    },
  )

  return response.data
}
