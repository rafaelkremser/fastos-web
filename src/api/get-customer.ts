import { api } from '@/lib/axios'

import type { Customer } from './types'

export async function getCustomer(customerId: string) {
  const response = await api.get<{ customer: Customer }>(
    `/customers/${customerId}`,
  )

  return response.data.customer
}
