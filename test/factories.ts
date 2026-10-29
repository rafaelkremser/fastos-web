import type {
  ServiceOrder,
  ServiceOrderSummary,
  User,
  UserRole,
} from '@/api/types'

// Ready-made API answers for the tests; each takes the fields that matter

export function makeUser(override: Partial<User> = {}): User {
  return {
    id: 'u1',
    name: 'Rafaela Dona',
    email: 'dona@example.com',
    role: 'OWNER' as UserRole,
    isActive: true,
    createdAt: '2026-10-01T12:00:00.000Z',
    ...override,
  }
}

export function makeServiceOrderSummary(
  override: Partial<ServiceOrderSummary> = {},
): ServiceOrderSummary {
  return {
    id: 'so1',
    number: 12,
    status: 'OPEN',
    priority: 'NORMAL',
    customer: { id: 'c1', name: 'Maria Souza', phone: '11987654321' },
    device: { id: 'd1', type: 'SMARTPHONE', brand: 'Samsung', model: 'A54' },
    technician: null,
    entryDate: '2026-10-20T12:00:00.000Z',
    estimatedDate: null,
    customerNotifiedAt: null,
    needsCustomerNotice: false,
    createdAt: '2026-10-20T12:00:00.000Z',
    ...override,
  }
}

export function makeServiceOrder(
  override: Partial<ServiceOrder> = {},
): ServiceOrder {
  return {
    id: 'so1',
    number: 12,
    customerId: 'c1',
    deviceId: 'd1',
    status: 'OPEN',
    priority: 'NORMAL',
    technicianId: null,
    createdById: 'u1',
    problemDescription: 'Tela trincada depois de uma queda',
    diagnosis: null,
    solution: null,
    entryDate: '2026-10-20T12:00:00.000Z',
    estimatedDate: null,
    completedDate: null,
    deliveredDate: null,
    estimatedCost: null,
    finalCost: null,
    discount: 0,
    items: [],
    totalItemsCost: 0,
    totalWithDiscount: 0,
    internalNotes: null,
    customerNotes: null,
    warrantyDays: 90,
    warrantyUntil: null,
    customerNotifiedAt: null,
    needsCustomerNotice: false,
    createdAt: '2026-10-20T12:00:00.000Z',
    ...override,
  }
}
