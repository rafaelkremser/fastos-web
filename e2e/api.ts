import type { APIRequestContext, APIResponse } from '@playwright/test'

import { uniqueId, uniquePhone } from './config.ts'

// What a test needs but does not test goes in through the API, the way the
// API's scripts/seed-dev.mjs does. It is faster than the screens and keeps
// each test about one thing

export interface Person {
  name: string
  email: string
  password: string
}

export interface Store {
  name: string
  slug: string
  owner: Person
}

export interface Tokens {
  accessToken: string
  refreshToken: string
}

export type TeamRole = 'ADMIN' | 'TECHNICIAN' | 'RECEPTIONIST'

async function read<T>(response: APIResponse): Promise<T> {
  if (!response.ok()) {
    throw new Error(
      `${response.url()} respondeu ${response.status()}: ${await response.text()}`,
    )
  }

  return response.json()
}

function authorized(tokens: Tokens) {
  return { Authorization: `Bearer ${tokens.accessToken}` }
}

export function makePerson(name: string): Person {
  const id = uniqueId()

  return {
    name: `${name} ${id}`,
    email: `${id}@fastos.test`,
    password: `senha-${id}`,
  }
}

// Through the public sign-up; the API runs with TENANT_AUTO_APPROVAL, so the
// store is open right away
export async function createStore(api: APIRequestContext): Promise<Store> {
  const id = uniqueId()
  const store: Store = {
    name: `Oficina ${id}`,
    slug: `oficina-${id}`,
    owner: makePerson('Dona'),
  }

  await read(
    await api.post('/accounts', {
      data: {
        tenantName: store.name,
        tenantSlug: store.slug,
        tenantEmail: `contato-${id}@fastos.test`,
        tenantPhone: null,
        ownerName: store.owner.name,
        ownerEmail: store.owner.email,
        ownerPassword: store.owner.password,
      },
    }),
  )

  return store
}

export async function signIn(
  api: APIRequestContext,
  slug: string,
  person: Person,
): Promise<Tokens> {
  const data = await read<{ access_token: string; refresh_token: string }>(
    await api.post('/authenticate', {
      data: {
        tenantSlug: slug,
        email: person.email,
        password: person.password,
      },
    }),
  )

  return { accessToken: data.access_token, refreshToken: data.refresh_token }
}

export async function createTeamMember(
  api: APIRequestContext,
  owner: Tokens,
  role: TeamRole,
  person: Person,
) {
  await read(
    await api.post('/users', {
      headers: authorized(owner),
      data: { ...person, role },
    }),
  )
}

// A customer with a phone, a device and an open order
export async function createServiceOrder(
  api: APIRequestContext,
  tokens: Tokens,
) {
  const headers = authorized(tokens)

  const { customer } = await read<{ customer: { id: string; name: string } }>(
    await api.post('/customers', {
      headers,
      data: { name: `Cliente ${uniqueId()}`, phone: uniquePhone() },
    }),
  )
  const { device } = await read<{ device: { id: string } }>(
    await api.post('/devices', {
      headers,
      data: {
        customerId: customer.id,
        type: 'SMARTPHONE',
        brand: 'Motorola',
        model: 'Moto G84',
      },
    }),
  )
  const { serviceOrder } = await read<{
    serviceOrder: { id: string; number: number }
  }>(
    await api.post('/service-orders', {
      headers,
      data: {
        customerId: customer.id,
        deviceId: device.id,
        problemDescription: 'Não carrega',
        priority: 'NORMAL',
      },
    }),
  )

  return { ...serviceOrder, customer }
}
