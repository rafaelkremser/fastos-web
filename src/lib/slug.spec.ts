import { hasValidSlugFormat, isReservedSlug, slugify } from './slug'

describe('slugify', () => {
  it('should turn a store name into an address', () => {
    expect(slugify('Assistência Técnica São João')).toBe(
      'assistencia-tecnica-sao-joao',
    )
    expect(slugify('  Cell & Cia!  ')).toBe('cell-cia')
  })

  it('should not end with a hyphen after cutting at 63 characters', () => {
    const slug = slugify(`${'a'.repeat(62)} b`)

    expect(slug).toBe('a'.repeat(62))
  })
})

describe('hasValidSlugFormat', () => {
  it('should accept lowercase letters, numbers and single hyphens', () => {
    expect(hasValidSlugFormat('loja-a')).toBe(true)
    expect(hasValidSlugFormat('cell2000')).toBe(true)
  })

  it('should reject other addresses', () => {
    expect(hasValidSlugFormat('ab')).toBe(false)
    expect(hasValidSlugFormat('a'.repeat(64))).toBe(false)
    expect(hasValidSlugFormat('loja--a')).toBe(false)
    expect(hasValidSlugFormat('-loja')).toBe(false)
    expect(hasValidSlugFormat('Loja')).toBe(false)
  })
})

describe('isReservedSlug', () => {
  it('should flag subdomains the platform keeps', () => {
    expect(isReservedSlug('api')).toBe(true)
    expect(isReservedSlug('loja-a')).toBe(false)
  })
})
