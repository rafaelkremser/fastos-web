import type { Device } from '@/api/types'

// The API takes any type; these are the ones the forms offer
export const DEVICE_TYPES = [
  { value: 'SMARTPHONE', label: 'Celular' },
  { value: 'TABLET', label: 'Tablet' },
  { value: 'NOTEBOOK', label: 'Notebook' },
  { value: 'DESKTOP', label: 'Computador' },
  { value: 'SMARTWATCH', label: 'Relógio inteligente' },
  { value: 'CONSOLE', label: 'Videogame' },
  { value: 'OTHER', label: 'Outro' },
]

export function getDeviceTypeLabel(type: string) {
  return DEVICE_TYPES.find((option) => option.value === type)?.label ?? type
}

// "Celular Samsung Galaxy A54"
export function describeDevice(
  device: Pick<Device, 'type' | 'brand' | 'model'>,
) {
  return [getDeviceTypeLabel(device.type), device.brand, device.model]
    .filter(Boolean)
    .join(' ')
}
