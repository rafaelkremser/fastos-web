import { buildAppUrl, getTenantSlug } from './tenant'

describe('buildAppUrl', () => {
  it('should keep the protocol and the port', () => {
    expect(
      buildAppUrl('loja-a.localhost', '/sign-in', {
        protocol: 'http:',
        port: '5173',
      }),
    ).toBe('http://loja-a.localhost:5173/sign-in')
  })

  it('should leave the port out when there is none', () => {
    expect(
      buildAppUrl('consertiva.com.br', '/', { protocol: 'https:', port: '' }),
    ).toBe('https://consertiva.com.br/')
  })
})

describe('getTenantSlug', () => {
  it('should read the store from the subdomain', () => {
    expect(getTenantSlug('loja-a.localhost', 'localhost')).toBe('loja-a')
    expect(getTenantSlug('loja-a.consertiva.com.br', 'consertiva.com.br')).toBe(
      'loja-a',
    )
  })

  it('should treat the app host and www as the public site', () => {
    expect(getTenantSlug('localhost', 'localhost')).toBeNull()
    expect(
      getTenantSlug('www.consertiva.com.br', 'consertiva.com.br'),
    ).toBeNull()
  })

  it('should ignore more than one level of subdomain', () => {
    expect(getTenantSlug('a.loja-a.localhost', 'localhost')).toBeNull()
  })

  it('should ignore hosts that only end with the same letters', () => {
    expect(
      getTenantSlug('lojaconsertiva.com.br', 'consertiva.com.br'),
    ).toBeNull()
    expect(getTenantSlug('loja-a.example.com', 'localhost')).toBeNull()
  })
})
