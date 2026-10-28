// Shapes the API answers with, shared by the functions in src/api

export interface PaginationMeta {
  page: number
  perPage: number
  totalCount: number
}

export interface Customer {
  id: string
  name: string
  phone: string
  phone2: string | null
  email: string | null
  document: string | null
  zipCode: string | null
  address: string | null
  addressNumber: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  notes: string | null
  createdAt: string
}

export type CustomerBody = Omit<Customer, 'id' | 'createdAt'>

export interface Device {
  id: string
  customerId: string
  type: string
  brand: string | null
  model: string | null
  serialNumber: string | null
  imei: string | null
  color: string | null
  condition: string | null
  accessories: string | null
  notes: string | null
  createdAt: string
}

export type DeviceBody = Omit<Device, 'id' | 'customerId' | 'createdAt'>
