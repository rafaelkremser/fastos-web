import { buildNoticeMessage, buildWhatsAppLink } from './customer-notice'

const phone = { type: 'SMARTPHONE', brand: 'Samsung', model: 'Galaxy A54' }

// Intl separates "R$" from the amount with a no-break space
const plain = (text: string) => text.replace(/\s/g, ' ')

describe('buildNoticeMessage', () => {
  it('should tell that the device is ready, with the amount', () => {
    expect(
      plain(
        buildNoticeMessage({
          status: 'COMPLETED',
          number: 12,
          storeName: 'Oficina Demo',
          customerName: 'Maria Souza',
          device: phone,
          total: 520,
        }),
      ),
    ).toBe(
      'Olá, Maria! Aqui é da Oficina Demo. O seu celular Samsung Galaxy A54 (OS nº 12) está pronto para retirada. O valor ficou em R$ 520,00.',
    )
  })

  it('should ask to approve the quote', () => {
    expect(
      plain(
        buildNoticeMessage({
          status: 'WAITING_APPROVAL',
          number: 3,
          storeName: 'Oficina Demo',
          customerName: 'Conceição Ribeiro',
          device: { type: 'NOTEBOOK', brand: 'Dell', model: null },
          total: 269.9,
        }),
      ),
    ).toBe(
      'Olá, Conceição! Aqui é da Oficina Demo. O orçamento do seu notebook Dell (OS nº 3) ficou em R$ 269,90. Podemos seguir com o conserto?',
    )
  })

  it('should leave the amount out when there is none yet', () => {
    expect(
      buildNoticeMessage({
        status: 'COMPLETED',
        number: 5,
        storeName: 'Oficina Demo',
        customerName: 'Ana',
        device: { type: 'Drone', brand: null, model: null },
        total: 0,
      }),
    ).toBe(
      'Olá, Ana! Aqui é da Oficina Demo. O seu aparelho (OS nº 5) está pronto para retirada.',
    )
  })
})

describe('buildWhatsAppLink', () => {
  it('should add the country code to a Brazilian number', () => {
    expect(buildWhatsAppLink('(11) 98765-4321', 'Olá!')).toBe(
      'https://wa.me/5511987654321?text=Ol%C3%A1!',
    )
    expect(buildWhatsAppLink('5511987654321', 'Oi')).toBe(
      'https://wa.me/5511987654321?text=Oi',
    )
  })

  it('should give up on a number WhatsApp could not use', () => {
    expect(buildWhatsAppLink('98765-4321', 'Oi')).toBeNull()
    expect(buildWhatsAppLink('+44 20 7946 0958', 'Oi')).toBeNull()
  })
})
