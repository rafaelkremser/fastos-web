import { api } from '@/lib/axios'

import type { Device, DeviceBody } from './types'

export interface EditDeviceParams {
  deviceId: string
  body: DeviceBody
}

export async function editDevice({ deviceId, body }: EditDeviceParams) {
  const response = await api.put<{ device: Device }>(
    `/devices/${deviceId}`,
    body,
  )

  return response.data.device
}
