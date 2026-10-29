import { api } from '@/lib/axios'

import type { Device } from './types'

export async function getDevice(deviceId: string) {
  const response = await api.get<{ device: Device }>(`/devices/${deviceId}`)

  return response.data.device
}
