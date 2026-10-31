import { createServiceOrder, makePerson } from './api.ts'
import { storeUrl } from './config.ts'
import { expect, signInThroughPage, test } from './fixtures.ts'

test.describe('technician', () => {
  test.use({ role: 'TECHNICIAN' })

  test('should work on orders without seeing the money', async ({
    page,
    api,
    store,
  }) => {
    const serviceOrder = await createServiceOrder(api, store.ownerTokens)

    await page.goto(storeUrl(store.slug))
    await expect(
      page.getByRole('heading', { name: 'Em andamento' }),
    ).toBeVisible()
    await expect(page.getByText('Faturamento do mês')).toBeHidden()
    await expect(page.getByRole('region', { name: 'Por técnico' })).toBeHidden()

    await page.getByRole('link', { name: 'Ordens de serviço' }).click()
    await page
      .getByRole('row', { name: new RegExp(serviceOrder.customer.name) })
      .getByRole('link', { name: String(serviceOrder.number), exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Mudar status' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Adicionar item' }),
    ).toBeVisible()
    // Only the owner and admins hand out the work
    await expect(
      page.getByRole('button', { name: 'Técnico', exact: true }),
    ).toBeHidden()

    await page.getByRole('link', { name: 'Equipe' }).click()
    await expect(page.getByRole('heading', { name: 'Equipe' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Novo usuário' }),
    ).toBeHidden()
  })
})

test.describe('receptionist', () => {
  test.use({ role: 'RECEPTIONIST' })

  test('should change the status and record notices, and nothing else', async ({
    page,
    api,
    store,
  }) => {
    const serviceOrder = await createServiceOrder(api, store.ownerTokens)

    await page.goto(storeUrl(store.slug, `/service-orders/${serviceOrder.id}`))
    await expect(
      page.getByRole('heading', { name: `OS nº ${serviceOrder.number}` }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Mudar status' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Registrar aviso' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Editar' })).toBeHidden()
    await expect(
      page.getByRole('button', { name: 'Adicionar item' }),
    ).toBeHidden()

    await page.getByRole('link', { name: serviceOrder.customer.name }).click()
    await expect(
      page.getByRole('heading', { name: serviceOrder.customer.name }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Excluir' })).toBeHidden()
  })
})

test.describe('owner', () => {
  test.use({ role: 'OWNER' })

  test('should add a technician who can sign in right away', async ({
    page,
    browser,
    store,
  }) => {
    const technician = makePerson('Técnica')

    await page.goto(storeUrl(store.slug, '/team'))
    await page.getByRole('button', { name: 'Novo usuário' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome').fill(technician.name)
    await dialog.getByLabel('E-mail').fill(technician.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(technician.password)
    await dialog.getByRole('button', { name: 'Cadastrar usuário' }).click()
    await expect(dialog).toContainText(`${technician.name} entrou na equipe`)
    await dialog.getByRole('button', { name: 'Fechar' }).click()
    await expect(
      page.getByRole('row', { name: new RegExp(technician.name) }),
    ).toContainText('Técnico')

    // A browser of its own, as on the technician's computer. New contexts
    // take the test's options, so the owner's session is cleared here
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const technicianPage = await context.newPage()
    await signInThroughPage(technicianPage, store.slug, technician)
    await expect(
      technicianPage.getByRole('heading', { name: 'Início' }),
    ).toBeVisible()
    await context.close()
  })
})
