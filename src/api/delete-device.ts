import { api } from '@/lib/axios'

// A device with service orders cannot be deleted: the API answers 409
export async function deleteDevice(deviceId: string) {
  await api.delete(`/devices/${deviceId}`)
}
