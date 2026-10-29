import { api } from '@/lib/axios'

export interface RemoveServiceOrderItemParams {
  serviceOrderId: string
  itemId: string
}

export async function removeServiceOrderItem({
  serviceOrderId,
  itemId,
}: RemoveServiceOrderItemParams) {
  await api.delete(`/service-orders/${serviceOrderId}/items/${itemId}`)
}
