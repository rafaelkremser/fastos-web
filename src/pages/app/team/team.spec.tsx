import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { createUser } from '@/api/create-user'
import { fetchUsers } from '@/api/fetch-users'
import { getUser } from '@/api/get-user'
import type { UserRole } from '@/api/types'

import { apiError } from '../../../../test/api-error'
import { makeUser } from '../../../../test/factories'
import { renderWithProviders } from '../../../../test/render-with-providers'
import { Team } from './team'

vi.mock('@/api/create-user', () => ({ createUser: vi.fn() }))
vi.mock('@/api/fetch-users', () => ({ fetchUsers: vi.fn() }))
vi.mock('@/api/get-user', () => ({ getUser: vi.fn() }))

function renderAs(role: UserRole) {
  vi.mocked(getUser).mockResolvedValue(makeUser({ id: 'u1', role }))

  renderWithProviders(<Team />, { route: '/team' })
}

beforeEach(() => {
  vi.mocked(fetchUsers).mockResolvedValue([
    makeUser({
      id: 'u2',
      name: 'Ana Antiga',
      role: 'RECEPTIONIST',
      isActive: false,
    }),
    makeUser({ id: 't1', name: 'Carlos Técnico', role: 'TECHNICIAN' }),
    makeUser({ id: 'u1', name: 'Rafaela Dona', role: 'OWNER' }),
  ])
})

async function openDialog() {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Novo usuário' }))

  return { user, dialog: within(screen.getByRole('dialog')) }
}

describe('Team', () => {
  it('should list the team with each role, marking who is looking', async () => {
    renderAs('RECEPTIONIST')

    const table = within(await screen.findByRole('table'))
    const owner = within(
      (await table.findByText('Rafaela Dona')).closest('tr')!,
    )
    expect(owner.getByText('Dono')).toBeInTheDocument()
    expect(owner.getByText('(você)')).toBeInTheDocument()

    const former = within(table.getByText('Ana Antiga').closest('tr')!)
    expect(former.getByText('Atendente')).toBeInTheDocument()
    expect(former.getByText('Inativo')).toBeInTheDocument()

    expect(table.getByText('Técnico')).toBeInTheDocument()
  })

  it('should offer adding people only to owners and admins', async () => {
    renderAs('TECHNICIAN')
    await screen.findByText('Carlos Técnico')

    expect(screen.queryByRole('button', { name: 'Novo usuário' })).toBeNull()
  })

  it('should let an admin give only the technician and receptionist roles', async () => {
    renderAs('ADMIN')
    const { user, dialog } = await openDialog()

    await user.click(dialog.getByRole('combobox', { name: 'Papel' }))

    expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual(['Técnico', 'Atendente'])
  })

  it('should create the user and show how they sign in', async () => {
    vi.mocked(createUser).mockResolvedValue(
      makeUser({
        id: 'u3',
        name: 'Bruna Admin',
        email: 'bruna@example.com',
        role: 'ADMIN',
      }),
    )
    renderAs('OWNER')
    const { user, dialog } = await openDialog()

    await user.type(dialog.getByLabelText('Nome'), 'Bruna Admin')
    await user.type(dialog.getByLabelText('E-mail'), 'bruna@example.com')
    await user.type(dialog.getByLabelText('Senha'), 'segredo1')
    await user.click(dialog.getByRole('combobox', { name: 'Papel' }))
    await user.click(screen.getByRole('option', { name: 'Administrador' }))
    await user.click(dialog.getByRole('button', { name: 'Cadastrar usuário' }))

    expect(createUser).toHaveBeenCalledWith(
      {
        name: 'Bruna Admin',
        email: 'bruna@example.com',
        password: 'segredo1',
        role: 'ADMIN',
      },
      expect.anything(),
    )

    const done = within(await screen.findByRole('dialog'))
    expect(
      await done.findByText('Bruna Admin entrou na equipe'),
    ).toBeInTheDocument()
    const signInUrl = `${window.location.origin}/sign-in`
    expect(done.getByText(signInUrl)).toBeInTheDocument()

    await user.click(done.getByRole('button', { name: 'Copiar acesso' }))
    expect(await navigator.clipboard.readText()).toBe(
      `Endereço: ${signInUrl}\nE-mail: bruna@example.com`,
    )
    // The list fetches the team again, with the new person
    expect(fetchUsers).toHaveBeenCalledTimes(2)

    // Opening it again starts a new form, not the last one's summary
    await user.click(done.getByRole('button', { name: 'Fechar' }))
    await user.click(screen.getByRole('button', { name: 'Novo usuário' }))
    const again = within(screen.getByRole('dialog'))
    expect(again.getByLabelText('Nome')).toHaveValue('')
  })

  it('should check the password and tell when the e-mail is taken', async () => {
    vi.mocked(createUser).mockRejectedValue(apiError(409))
    renderAs('OWNER')
    const { user, dialog } = await openDialog()

    await user.type(dialog.getByLabelText('Nome'), 'Carlos Dois')
    await user.type(dialog.getByLabelText('E-mail'), 'carlos@example.com')
    await user.type(dialog.getByLabelText('Senha'), '123')
    await user.click(dialog.getByRole('button', { name: 'Cadastrar usuário' }))

    expect(
      await dialog.findByText('A senha precisa de pelo menos 6 caracteres.'),
    ).toBeInTheDocument()
    expect(createUser).not.toHaveBeenCalled()

    await user.type(dialog.getByLabelText('Senha'), '456')
    await user.click(dialog.getByRole('button', { name: 'Cadastrar usuário' }))

    expect(
      await dialog.findByText('Já existe alguém com esse e-mail na loja.'),
    ).toBeInTheDocument()
  })
})
