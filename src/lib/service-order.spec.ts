import { makeServiceOrder } from '../../test/factories'
import { getNextStatus, getTotalLines } from './service-order'

// Intl separates "R$" from the amount with a no-break space
function lines(...args: Parameters<typeof getTotalLines>) {
  return getTotalLines(...args).map(
    (line) => `${line.label}: ${line.value.replace(/\s/g, ' ')}`,
  )
}

const items = [
  {
    id: 'i1',
    type: 'PART' as const,
    description: 'Teclado',
    quantity: 1,
    unitPrice: 340,
    totalPrice: 340,
    createdAt: '2026-10-20T12:00:00.000Z',
  },
]

describe('getTotalLines', () => {
  it('should take the total from the items when there is no other amount', () => {
    expect(
      lines(
        makeServiceOrder({
          items,
          totalItemsCost: 340,
          discount: 40,
          totalWithDiscount: 300,
        }),
      ),
    ).toEqual([
      'Soma dos itens: R$ 340,00',
      'Desconto: − R$ 40,00',
      'Total: R$ 300,00',
    ])
  })

  it('should say when the final amount replaces the items', () => {
    expect(
      lines(
        makeServiceOrder({
          items,
          totalItemsCost: 340,
          estimatedCost: 300,
          finalCost: 350,
          discount: 25.5,
          totalWithDiscount: 324.5,
        }),
      ),
    ).toEqual([
      'Soma dos itens: R$ 340,00',
      'Valor final (é ele que vale no total): R$ 350,00',
      'Desconto: − R$ 25,50',
      'Total: R$ 324,50',
    ])
  })

  it('should show only the total when it is just the sum of the items', () => {
    expect(
      lines(
        makeServiceOrder({
          items,
          totalItemsCost: 340,
          totalWithDiscount: 340,
        }),
      ),
    ).toEqual(['Total: R$ 340,00'])
  })

  it('should use the quote when there is no final amount', () => {
    expect(
      lines(makeServiceOrder({ estimatedCost: 200, totalWithDiscount: 200 })),
    ).toEqual([
      'Orçamento (é ele que vale no total): R$ 200,00',
      'Total: R$ 200,00',
    ])
  })
})

describe('getNextStatus', () => {
  it('should suggest the usual next step and none after the end', () => {
    expect(getNextStatus('OPEN')).toBe('IN_ANALYSIS')
    expect(getNextStatus('WAITING_PARTS')).toBe('IN_PROGRESS')
    expect(getNextStatus('DELIVERED')).toBeNull()
    expect(getNextStatus('CANCELLED')).toBeNull()
  })
})
