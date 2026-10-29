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

// A moment (like createdAt), shown as the day it was where the user is
export function formatDate(date: string) {
  return dateFormatter.format(new Date(date))
}

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formatDateTime(date: string) {
  return dateTimeFormatter.format(new Date(date))
}

const dayFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

// A day without time (like a due date). The API keeps it as midnight UTC,
// which in Brazil would show as the day before
export function formatDay(date: string) {
  return dayFormatter.format(new Date(date))
}

// "2026-10-30T00:00:00.000Z" -> "2026-10-30", the value of a date input
export function toDateInputValue(date: string | null) {
  return date ? date.slice(0, 10) : ''
}

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatMoney(value: number) {
  return moneyFormatter.format(value)
}

// What a person types for an amount: "1.234,56", "189,9" or "189.90". Null
// when it is not a valid amount
export function parseMoney(text: string) {
  const value = text.trim().replace(/^R\$\s*/, '')

  if (!value) {
    return null
  }

  // With a comma, it is the decimal separator and dots group thousands
  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null
  }

  return Number(normalized)
}

// 189.9 -> "189,90", for filling a money field
export function toMoneyInputValue(value: number | null) {
  return value === null
    ? ''
    : value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
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
