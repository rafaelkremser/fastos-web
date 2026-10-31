import type { Page } from '@playwright/test'

import { createTeamMember, makePerson } from './api.ts'
import { storeUrl, uniqueId, uniquePhone } from './config.ts'
import { expect, test } from './fixtures.ts'

test.use({ role: 'OWNER' })

async function changeStatus(page: Page, label: string) {
  await page.getByRole('button', { name: 'Mudar status' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Novo status').click()
  await page.getByRole('option', { name: label, exact: true }).click()
  await dialog.getByRole('button', { name: 'Mudar status' }).click()
  await expect(page.getByText(`OS agora está como "${label}".`)).toBeVisible()
  await expect(dialog).toBeHidden()
}

test('should take a device from check-in to delivery', async ({
  page,
  api,
  store,
}) => {
  // A technician of its own, so the dashboard row counts only this order
  const technician = makePerson('Técnico')
  await createTeamMember(api, store.ownerTokens, 'TECHNICIAN', technician)
  const customerName = `Cliente ${uniqueId()}`

  await page.goto(storeUrl(store.slug, '/customers'))
  await page.getByRole('button', { name: 'Novo cliente' }).click()
  let dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nome', { exact: true }).fill(customerName)
  await dialog.getByLabel('Telefone', { exact: true }).fill(uniquePhone())
  await dialog.getByRole('button', { name: 'Cadastrar cliente' }).click()
  await expect(page.getByRole('heading', { name: customerName })).toBeVisible()

  await page.getByRole('button', { name: 'Novo aparelho' }).click()
  dialog = page.getByRole('dialog')
  await dialog.getByLabel('Tipo').click()
  await page.getByRole('option', { name: 'Celular' }).click()
  await dialog.getByLabel('Marca').fill('Samsung')
  await dialog.getByLabel('Modelo').fill('Galaxy S21')
  await dialog.getByRole('button', { name: 'Cadastrar aparelho' }).click()
  await expect(page.getByText('Aparelho cadastrado.')).toBeVisible()

  // The customer's button; each device also has one
  await page.getByRole('link', { name: 'Abrir OS', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Nova OS' })).toBeVisible()
  await page.getByRole('radio', { name: /Celular Samsung Galaxy S21/ }).click()
  await page.getByLabel('O que o cliente relatou').fill('Tela trincada')
  await page.getByRole('button', { name: 'Abrir OS' }).click()
  await expect(page.getByRole('heading', { name: /^OS nº \d+$/ })).toBeVisible()

  await page.getByRole('button', { name: 'Técnico', exact: true }).click()
  dialog = page.getByRole('dialog')
  await dialog.getByLabel('Técnico').click()
  await page.getByRole('option', { name: new RegExp(technician.name) }).click()
  await dialog.getByRole('button', { name: 'Atribuir' }).click()
  await expect(page.getByText('Técnico atribuído.')).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar item' }).click()
  dialog = page.getByRole('dialog')
  await dialog.getByLabel('Descrição').fill('Troca de tela')
  await dialog.getByLabel('Valor unitário').fill('350,00')
  await dialog.getByRole('button', { name: 'Adicionar' }).click()
  await expect(page.getByRole('row', { name: /Troca de tela/ })).toContainText(
    'R$ 350,00',
  )

  await changeStatus(page, 'Pronta')

  // Ready, so the customer has to be told before the order leaves the list
  const notice = page.getByRole('region', { name: 'Aviso ao cliente' })
  await expect(notice).toContainText('Pronta: falta avisar o cliente')
  await notice.getByRole('button', { name: 'Registrar aviso' }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Registrar aviso' })
    .click()
  await expect(page.getByText('Aviso registrado.')).toBeVisible()
  await expect(notice).toBeHidden()

  await changeStatus(page, 'Entregue')

  // Completed and delivered this month, with the revenue, and nothing left
  await page.getByRole('link', { name: 'Início' }).click()
  const row = page
    .getByRole('region', { name: 'Por técnico' })
    .getByRole('row', { name: new RegExp(technician.name) })
  await expect(row.getByRole('cell')).toHaveText([
    technician.name,
    '0',
    '0',
    '1',
    '1',
    'R$ 350,00',
  ])
})
