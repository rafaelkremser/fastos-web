import { api } from '@/lib/axios'

import type { ServiceOrder } from './types'

export type NoticeChannel = 'WHATSAPP' | 'PHONE' | 'SMS' | 'EMAIL' | 'IN_PERSON'

export interface RegisterCustomerNoticeParams {
  serviceOrderId: string
  channel: NoticeChannel
  // Goes to the history, after "Cliente avisado por ..."
  notes?: string
}

export async function registerCustomerNotice({
  serviceOrderId,
  channel,
  notes,
}: RegisterCustomerNoticeParams) {
  const response = await api.post<{ serviceOrder: ServiceOrder }>(
    `/service-orders/${serviceOrderId}/notices`,
    { channel, ...(notes && { notes }) },
  )

  return response.data.serviceOrder
}
