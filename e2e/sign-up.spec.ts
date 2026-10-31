import { createStore } from './api.ts'
import { storeUrl, uniqueId } from './config.ts'
import { expect, signInThroughPage, test } from './fixtures.ts'

test('should sign up a store and sign in on its own address', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `oficina-${id}`
  const owner = { email: `${id}@fastos.test`, password: `senha-${id}` }

  await page.goto('/sign-up')
  await page.getByLabel('Nome da loja').fill(`Oficina ${id}`)
  // The address comes from the name
  await expect(page.getByLabel('Endereço da loja')).toHaveValue(slug)
  await page.getByLabel('E-mail da loja').fill(`contato-${id}@fastos.test`)
  await page.getByLabel('Seu nome').fill('Rafaela Dona')
  await page.getByLabel('Seu e-mail').fill(owner.email)
  await page.getByLabel('Senha').fill(owner.password)
  await page.getByRole('button', { name: 'Cadastrar loja' }).click()

  await expect(page).toHaveURL(storeUrl(slug, '/sign-in'))
  await expect(page.getByText('Loja cadastrada!')).toBeVisible()

  await signInThroughPage(page, slug, owner)
  await expect(page.getByRole('heading', { name: 'Início' })).toBeVisible()

  // Only the refresh token survives a reload, and it brings the session back
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Início' })).toBeVisible()

  await page.getByRole('button', { name: `Oficina ${id}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page).toHaveURL(storeUrl(slug, '/sign-in'))
})

test('should not take an address in use', async ({ page, store }) => {
  await page.goto('/sign-up')
  await page.getByLabel('Nome da loja').fill('Outra oficina')
  await page.getByLabel('Endereço da loja').fill(store.slug)
  await page.getByLabel('E-mail da loja').fill(`${uniqueId()}@fastos.test`)
  await page.getByLabel('Seu nome').fill('Outra pessoa')
  await page.getByLabel('Seu e-mail').fill(`${uniqueId()}@fastos.test`)
  await page.getByLabel('Senha').fill('senha-forte')
  await page.getByRole('button', { name: 'Cadastrar loja' }).click()

  await expect(
    page.getByText('Esse endereço já está em uso. Escolha outro.'),
  ).toBeVisible()
})

test('should refuse a wrong password and an account from another store', async ({
  page,
  api,
  store,
}) => {
  await signInThroughPage(page, store.slug, {
    email: store.owner.email,
    password: 'senha-errada',
  })
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()

  // The right email and password, on a store the account is not part of
  const otherStore = await createStore(api)
  await signInThroughPage(page, otherStore.slug, store.owner)
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
  await expect(page).toHaveURL(storeUrl(otherStore.slug, '/sign-in'))
})
