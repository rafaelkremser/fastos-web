import { api } from '@/lib/axios'

import type { Device, PaginationMeta } from './types'

export interface FetchCustomerDevicesQuery {
  customerId: string
  page: number
}

export interface FetchCustomerDevicesResponse {
  devices: Device[]
  meta: PaginationMeta
}

export async function fetchCustomerDevices({
  customerId,
  page,
}: FetchCustomerDevicesQuery) {
  const response = await api.get<FetchCustomerDevicesResponse>(
    `/customers/${customerId}/devices`,
    { params: { page } },
  )

  return response.data
}
