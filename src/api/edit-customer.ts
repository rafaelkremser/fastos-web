import { api } from '@/lib/axios'

import type { Customer, CustomerBody } from './types'

export interface EditCustomerParams {
  customerId: string
  body: CustomerBody
}

export async function editCustomer({ customerId, body }: EditCustomerParams) {
  const response = await api.put<{ customer: Customer }>(
    `/customers/${customerId}`,
    body,
  )

  return response.data.customer
}
