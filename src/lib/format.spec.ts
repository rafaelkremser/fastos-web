import { formatAddress, formatPhone, onlyDigits } from './format'

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
