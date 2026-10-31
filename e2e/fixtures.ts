import {
  type APIRequestContext,
  expect,
  type Page,
  request,
  test as base,
} from '@playwright/test'

import {
  createStore,
  createTeamMember,
  makePerson,
  type Person,
  signIn,
  type Store,
  type Tokens,
} from './api.ts'
import { API_URL, storeOrigin, storeUrl } from './config.ts'

// The same key as src/lib/session.ts
const REFRESH_TOKEN_KEY = 'fastos-refresh-token'

export type Role = 'OWNER' | 'TECHNICIAN' | 'RECEPTIONIST'

export interface TestStore extends Store {
  technician: Person
  receptionist: Person
  // For what the tests set up through the API
  ownerTokens: Tokens
}

interface WorkerFixtures {
  api: APIRequestContext
  store: TestStore
  // Each person signs in once per run, since the API takes only 10 logins a
  // minute from one IP. The refresh token can be used again and again
  signInAs: (person: Person) => Promise<Tokens>
}

interface TestFixtures {
  // Who the page starts signed in as; null opens it signed out
  role: Role | null
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  api: [
    async ({}, use) => {
      const api = await request.newContext({ baseURL: API_URL })
      await use(api)
      await api.dispose()
    },
    { scope: 'worker' },
  ],

  store: [
    async ({ api }, use) => {
      const store = await createStore(api)
      const ownerTokens = await signIn(api, store.slug, store.owner)
      const technician = makePerson('Técnico')
      const receptionist = makePerson('Atendente')

      await createTeamMember(api, ownerTokens, 'TECHNICIAN', technician)
      await createTeamMember(api, ownerTokens, 'RECEPTIONIST', receptionist)

      await use({ ...store, technician, receptionist, ownerTokens })
    },
    { scope: 'worker' },
  ],

  signInAs: [
    async ({ api, store }, use) => {
      const sessions = new Map([
        [store.owner.email, Promise.resolve(store.ownerTokens)],
      ])

      await use((person) => {
        let tokens = sessions.get(person.email)

        if (!tokens) {
          tokens = signIn(api, store.slug, person)
          sessions.set(person.email, tokens)
        }

        return tokens
      })
    },
    { scope: 'worker' },
  ],

  role: [null, { option: true }],

  // The browser starts with the refresh token, as after a reload: the app's
  // first request gets an access token with it
  storageState: async ({ role, store, signInAs }, use) => {
    if (!role) {
      await use(undefined)
      return
    }

    const person = {
      OWNER: store.owner,
      TECHNICIAN: store.technician,
      RECEPTIONIST: store.receptionist,
    }[role]
    const { refreshToken } = await signInAs(person)

    await use({
      cookies: [],
      origins: [
        {
          origin: storeOrigin(store.slug),
          localStorage: [{ name: REFRESH_TOKEN_KEY, value: refreshToken }],
        },
      ],
    })
  },
})

export { expect }

export async function signInThroughPage(
  page: Page,
  slug: string,
  person: Pick<Person, 'email' | 'password'>,
) {
  await page.goto(storeUrl(slug, '/sign-in'))
  await page.getByLabel('E-mail', { exact: true }).fill(person.email)
  await page.getByLabel('Senha', { exact: true }).fill(person.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}
