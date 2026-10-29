import type { NoticeChannel } from '@/api/register-customer-notice'
import type { Device, ServiceOrderStatus } from '@/api/types'

import { getDeviceTypeLabel } from './device-types'
import { formatMoney, onlyDigits } from './format'

export const NOTICE_CHANNELS: { value: NoticeChannel; label: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'PHONE', label: 'Ligação' },
  { value: 'SMS', label: 'SMS' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'IN_PERSON', label: 'Pessoalmente' },
]

// "Celular Samsung Galaxy A54" -> "celular Samsung Galaxy A54", to go after
// "seu" in a sentence. An unknown type becomes "aparelho"
function deviceInSentence(device: Pick<Device, 'type' | 'brand' | 'model'>) {
  const label = getDeviceTypeLabel(device.type)
  const type =
    label === device.type || device.type === 'OTHER'
      ? 'aparelho'
      : label.toLowerCase()

  return [type, device.brand, device.model].filter(Boolean).join(' ')
}

interface NoticeMessageParams {
  status: ServiceOrderStatus
  number: number
  storeName: string
  customerName: string
  device: Pick<Device, 'type' | 'brand' | 'model'>
  // In reais; left out of the message when zero
  total: number
}

// What the store sends the customer, ready to paste or to open in WhatsApp
export function buildNoticeMessage({
  status,
  number,
  storeName,
  customerName,
  device,
  total,
}: NoticeMessageParams) {
  const greeting = `Olá, ${customerName.split(' ')[0]}! Aqui é da ${storeName}.`
  const subject = `seu ${deviceInSentence(device)} (OS nº ${number})`
  const amount = total > 0 ? formatMoney(total) : null

  if (status === 'COMPLETED') {
    return [
      greeting,
      `O ${subject} está pronto para retirada.`,
      amount && `O valor ficou em ${amount}.`,
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (status === 'WAITING_APPROVAL') {
    return [
      greeting,
      amount
        ? `O orçamento do ${subject} ficou em ${amount}.`
        : `O orçamento do ${subject} está pronto.`,
      'Podemos seguir com o conserto?',
    ].join(' ')
  }

  return `${greeting} É sobre o ${subject}.`
}

// A link that opens WhatsApp with the message typed in. Null when the phone
// is not a Brazilian number WhatsApp could use
export function buildWhatsAppLink(phone: string, message: string) {
  const digits = onlyDigits(phone)

  const international =
    digits.length === 10 || digits.length === 11
      ? `55${digits}`
      : digits.startsWith('55') &&
          (digits.length === 12 || digits.length === 13)
        ? digits
        : null

  if (!international) {
    return null
  }

  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`
}
