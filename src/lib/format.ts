import type { Customer } from '@/api/types'

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

// "11987654321" -> "(11) 98765-4321". Anything else is shown as it was saved
export function formatPhone(phone: string) {
  const digits = onlyDigits(phone)

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return phone
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR')

export function formatDate(date: string) {
  return dateFormatter.format(new Date(date))
}

// "Rua das Flores, 120 - Apto 3 - Centro, Campinas/SP - CEP 13010-000"
export function formatAddress(
  customer: Pick<
    Customer,
    | 'address'
    | 'addressNumber'
    | 'complement'
    | 'neighborhood'
    | 'city'
    | 'state'
    | 'zipCode'
  >,
) {
  const street = [customer.address, customer.addressNumber]
    .filter(Boolean)
    .join(', ')
  const place = [customer.city, customer.state].filter(Boolean).join('/')
  const neighborhoodAndPlace = [customer.neighborhood, place]
    .filter(Boolean)
    .join(', ')

  return [
    street,
    customer.complement,
    neighborhoodAndPlace,
    customer.zipCode && `CEP ${customer.zipCode}`,
  ]
    .filter(Boolean)
    .join(' - ')
}
