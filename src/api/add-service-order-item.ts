import { api } from '@/lib/axios'

import type { ServiceOrderItem, ServiceOrderItemType } from './types'

export interface AddServiceOrderItemParams {
  serviceOrderId: string
  item: {
    type: ServiceOrderItemType
    description: string
    quantity: number
    // In reais
    unitPrice: number
  }
}

export async function addServiceOrderItem({
  serviceOrderId,
  item,
}: AddServiceOrderItemParams) {
  const response = await api.post<{ item: ServiceOrderItem }>(
    `/service-orders/${serviceOrderId}/items`,
    item,
  )

  return response.data.item
}
