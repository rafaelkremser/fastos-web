import { api } from '@/lib/axios'

import type { Device, DeviceBody } from './types'

export interface CreateDeviceParams {
  customerId: string
  body: DeviceBody
}

export async function createDevice({ customerId, body }: CreateDeviceParams) {
  const response = await api.post<{ device: Device }>('/devices', {
    customerId,
    ...body,
  })

  return response.data.device
}
