import {
  formatAddress,
  formatDay,
  formatMoney,
  formatPhone,
  onlyDigits,
  parseMoney,
  toMoneyInputValue,
} from './format'

describe('parseMoney', () => {
  it('should read amounts the Brazilian way and with a dot', () => {
    expect(parseMoney('189,90')).toBe(189.9)
    expect(parseMoney('1.234,56')).toBe(1234.56)
    expect(parseMoney('R$ 45')).toBe(45)
    expect(parseMoney('189.90')).toBe(189.9)
  })

  it('should refuse what is not an amount', () => {
    expect(parseMoney('')).toBeNull()
    expect(parseMoney('abc')).toBeNull()
    expect(parseMoney('-10')).toBeNull()
    expect(parseMoney('10,999')).toBeNull()
  })
})

describe('money in the screen', () => {
  it('should show amounts in reais', () => {
    // Intl puts a no-break space between "R$" and the amount
    expect(formatMoney(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50')
    expect(toMoneyInputValue(189.9)).toBe('189,90')
    expect(toMoneyInputValue(null)).toBe('')
  })
})

describe('formatDay', () => {
  it('should show the day the API saved, whatever the timezone', () => {
    expect(formatDay('2026-10-30T00:00:00.000Z')).toBe('30/10/2026')
  })
})

const noAddress = {
  address: null,
  addressNumber: null,
  complement: null,
  neighborhood: null,
  city: null,
  state: null,
  zipCode: null,
}

describe('formatPhone', () => {
  it('should format mobile and landline numbers with area code', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
  })

  it('should keep other numbers as they were saved', () => {
    expect(formatPhone('+44 20 7946 0958')).toBe('+44 20 7946 0958')
  })
})

describe('onlyDigits', () => {
  it('should drop everything that is not a digit', () => {
    expect(onlyDigits('(11) 98765-4321')).toBe('11987654321')
  })
})

describe('formatAddress', () => {
  it('should join the parts that were filled in', () => {
    expect(
      formatAddress({
        address: 'Rua das Flores',
        addressNumber: '120',
        complement: 'Apto 3',
        neighborhood: 'Centro',
        city: 'Campinas',
        state: 'SP',
        zipCode: '13010-000',
      }),
    ).toBe('Rua das Flores, 120 - Apto 3 - Centro, Campinas/SP - CEP 13010-000')
  })

  it('should skip missing parts', () => {
    expect(formatAddress({ ...noAddress, city: 'Campinas' })).toBe('Campinas')
    expect(formatAddress(noAddress)).toBe('')
  })
})
