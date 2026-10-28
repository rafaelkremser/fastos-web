import { api } from '@/lib/axios'

import type { Customer, PaginationMeta } from './types'

export interface FetchCustomersQuery {
  page: number
  search?: string | null
}

export interface FetchCustomersResponse {
  customers: Customer[]
  meta: PaginationMeta
}

export async function fetchCustomers({ page, search }: FetchCustomersQuery) {
  const response = await api.get<FetchCustomersResponse>('/customers', {
    params: { page, search: search || undefined },
  })

  return response.data
}
