import { api } from '@/lib/axios'

import type { Customer, CustomerBody } from './types'

export async function createCustomer(body: CustomerBody) {
  const response = await api.post<{ customer: Customer }>('/customers', body)

  return response.data.customer
}
