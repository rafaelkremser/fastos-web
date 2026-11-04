import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { changeUserRole } from '@/api/change-user-role'
import { createUser } from '@/api/create-user'
import { fetchUsers } from '@/api/fetch-users'
import { getUser } from '@/api/get-user'
import { setUserActive } from '@/api/set-user-active'
import type { UserRole } from '@/api/types'

import { apiError } from '../../../../test/api-error'
import { makeUser } from '../../../../test/factories'
import { renderWithProviders } from '../../../../test/render-with-providers'
import { Team } from './team'

vi.mock('@/api/change-user-role', () => ({ changeUserRole: vi.fn() }))
vi.mock('@/api/create-user', () => ({ createUser: vi.fn() }))
vi.mock('@/api/set-user-active', () => ({ setUserActive: vi.fn() }))
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

  describe('managing someone', () => {
    async function openActions(name: string) {
      const user = userEvent.setup()
      await user.click(
        await screen.findByRole('button', { name: `Ações para ${name}` }),
      )

      return user
    }

    it('should offer it only for whom the person looking may manage', async () => {
      vi.mocked(fetchUsers).mockResolvedValue([
        makeUser({ id: 'a2', name: 'Bruna Admin', role: 'ADMIN' }),
        makeUser({ id: 't1', name: 'Carlos Técnico', role: 'TECHNICIAN' }),
        makeUser({ id: 'u1', name: 'Diego Admin', role: 'ADMIN' }),
        makeUser({ id: 'o1', name: 'Rafaela Dona', role: 'OWNER' }),
      ])
      renderAs('ADMIN')

      expect(
        await screen.findByRole('button', {
          name: 'Ações para Carlos Técnico',
        }),
      ).toBeInTheDocument()
      // Not another admin, the owner or oneself
      for (const name of ['Bruna Admin', 'Rafaela Dona', 'Diego Admin']) {
        expect(
          screen.queryByRole('button', { name: `Ações para ${name}` }),
        ).toBeNull()
      }
    })

    it('should not offer it to technicians and receptionists', async () => {
      renderAs('RECEPTIONIST')
      await screen.findByText('Carlos Técnico')

      expect(screen.queryByRole('button', { name: /^Ações para/ })).toBeNull()
    })

    it('should change the role', async () => {
      vi.mocked(changeUserRole).mockResolvedValue(
        makeUser({ id: 't1', role: 'RECEPTIONIST' }),
      )
      renderAs('OWNER')
      const user = await openActions('Carlos Técnico')

      await user.click(screen.getByRole('menuitem', { name: 'Mudar papel' }))
      const dialog = within(screen.getByRole('dialog'))
      await user.click(dialog.getByRole('combobox', { name: 'Papel' }))
      expect(
        screen.getAllByRole('option').map((option) => option.textContent),
      ).toEqual(['Administrador', 'Técnico', 'Atendente'])
      await user.click(screen.getByRole('option', { name: 'Atendente' }))
      await user.click(dialog.getByRole('button', { name: 'Salvar' }))

      expect(changeUserRole).toHaveBeenCalledWith(
        { userId: 't1', role: 'RECEPTIONIST' },
        expect.anything(),
      )
      expect(
        await screen.findByText('Carlos Técnico agora é atendente.'),
      ).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(fetchUsers).toHaveBeenCalledTimes(2)
    })

    it('should ask before taking the access away', async () => {
      vi.mocked(setUserActive).mockResolvedValue(
        makeUser({ id: 't1', isActive: false }),
      )
      renderAs('OWNER')
      const user = await openActions('Carlos Técnico')

      await user.click(
        screen.getByRole('menuitem', { name: 'Desativar acesso' }),
      )
      const confirm = within(screen.getByRole('alertdialog'))
      expect(confirm.getByText('Desativar Carlos Técnico?')).toBeInTheDocument()
      expect(setUserActive).not.toHaveBeenCalled()

      await user.click(confirm.getByRole('button', { name: 'Desativar' }))

      expect(setUserActive).toHaveBeenCalledWith(
        { userId: 't1', isActive: false },
        expect.anything(),
      )
      expect(
        await screen.findByText('Carlos Técnico não tem mais acesso à loja.'),
      ).toBeInTheDocument()
    })

    it('should keep the question open when the API refuses', async () => {
      vi.mocked(setUserActive).mockRejectedValue(apiError(403))
      renderAs('OWNER')
      const user = await openActions('Carlos Técnico')

      await user.click(
        screen.getByRole('menuitem', { name: 'Desativar acesso' }),
      )
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', {
          name: 'Desativar',
        }),
      )

      expect(
        await screen.findByText('Você não pode mudar o acesso dessa pessoa.'),
      ).toBeInTheDocument()
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })

    it('should give the access back without asking', async () => {
      vi.mocked(setUserActive).mockResolvedValue(
        makeUser({ id: 'u2', isActive: true }),
      )
      renderAs('OWNER')
      const user = await openActions('Ana Antiga')

      await user.click(
        screen.getByRole('menuitem', { name: 'Reativar acesso' }),
      )

      expect(setUserActive).toHaveBeenCalledWith(
        { userId: 'u2', isActive: true },
        expect.anything(),
      )
      expect(
        await screen.findByText('Ana Antiga voltou a ter acesso à loja.'),
      ).toBeInTheDocument()
    })
  })
})
