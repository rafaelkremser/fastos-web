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

export type UserRole = 'OWNER' | 'ADMIN' | 'TECHNICIAN' | 'RECEPTIONIST'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export type ServiceOrderStatus =
  | 'OPEN'
  | 'IN_ANALYSIS'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED'

export type ServiceOrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type ServiceOrderItemType = 'SERVICE' | 'PART' | 'OTHER'

// A line of the service order list
export interface ServiceOrderSummary {
  id: string
  number: number
  status: ServiceOrderStatus
  priority: ServiceOrderPriority
  customer: { id: string; name: string; phone: string }
  device: {
    id: string
    type: string
    brand: string | null
    model: string | null
  }
  technician: { id: string; name: string } | null
  entryDate: string
  estimatedDate: string | null
  // When the store last told the customer about the current status
  customerNotifiedAt: string | null
  // Ready or waiting for quote approval, and not told yet
  needsCustomerNotice: boolean
  createdAt: string
}

export interface ServiceOrderItem {
  id: string
  type: ServiceOrderItemType
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  createdAt: string
}

// Amounts are in reais
export interface ServiceOrder {
  id: string
  number: number
  customerId: string
  deviceId: string
  status: ServiceOrderStatus
  priority: ServiceOrderPriority
  technicianId: string | null
  createdById: string
  problemDescription: string
  diagnosis: string | null
  solution: string | null
  entryDate: string
  estimatedDate: string | null
  completedDate: string | null
  deliveredDate: string | null
  estimatedCost: number | null
  finalCost: number | null
  discount: number
  items: ServiceOrderItem[]
  totalItemsCost: number
  totalWithDiscount: number
  internalNotes: string | null
  customerNotes: string | null
  warrantyDays: number
  warrantyUntil: string | null
  customerNotifiedAt: string | null
  needsCustomerNotice: boolean
  createdAt: string
}

export interface ServiceOrderHistoryEntry {
  id: string
  userId: string | null
  // STATUS_CHANGED, TECHNICIAN_ASSIGNED or CUSTOMER_NOTIFIED today
  action: string
  description: string
  oldValue: string | null
  newValue: string | null
  createdAt: string
}
