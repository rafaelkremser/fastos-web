import { api } from '@/lib/axios'

// Also deletes the customer's devices. A customer with service orders cannot
// be deleted: the API answers 409
export async function deleteCustomer(customerId: string) {
  await api.delete(`/customers/${customerId}`)
}
