import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { changePassword } from '@/api/change-password'
import { getTenant } from '@/api/get-tenant'
import { getUser } from '@/api/get-user'

import { apiError } from '../../test/api-error'
import { makeUser } from '../../test/factories'
import { renderWithProviders } from '../../test/render-with-providers'
import { AccountMenu } from './account-menu'

vi.mock('@/api/change-password', () => ({ changePassword: vi.fn() }))
vi.mock('@/api/get-tenant', () => ({ getTenant: vi.fn() }))
vi.mock('@/api/get-user', () => ({ getUser: vi.fn() }))

beforeEach(() => {
  vi.mocked(getTenant).mockResolvedValue({
    id: 'loja-1',
    name: 'Oficina Demo',
    slug: 'oficina-demo',
  } as Awaited<ReturnType<typeof getTenant>>)
  vi.mocked(getUser).mockResolvedValue(makeUser({ name: 'Rafaela Dona' }))
})

async function openPasswordDialog() {
  const user = userEvent.setup()
  renderWithProviders(<AccountMenu />)

  await user.click(await screen.findByRole('button', { name: /Oficina Demo/ }))
  await user.click(screen.getByRole('menuitem', { name: 'Trocar senha' }))

  return { user, dialog: within(screen.getByRole('dialog')) }
}

describe('AccountMenu', () => {
  it('should change the password after checking the new one twice', async () => {
    vi.mocked(changePassword).mockResolvedValue()
    const { user, dialog } = await openPasswordDialog()

    await user.type(dialog.getByLabelText('Senha atual'), 'antiga-1')
    await user.type(dialog.getByLabelText('Nova senha'), 'nova-senha')
    await user.type(dialog.getByLabelText('Repita a nova senha'), 'nova-sneha')
    await user.click(dialog.getByRole('button', { name: 'Trocar senha' }))

    expect(
      await dialog.findByText('A confirmação está diferente da nova senha.'),
    ).toBeInTheDocument()
    expect(changePassword).not.toHaveBeenCalled()

    await user.clear(dialog.getByLabelText('Repita a nova senha'))
    await user.type(dialog.getByLabelText('Repita a nova senha'), 'nova-senha')
    await user.click(dialog.getByRole('button', { name: 'Trocar senha' }))

    expect(changePassword).toHaveBeenCalledWith(
      { currentPassword: 'antiga-1', newPassword: 'nova-senha' },
      expect.anything(),
    )
    expect(
      await screen.findByText(
        'Senha trocada. Use a nova na próxima vez que entrar.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('should say when the current password is wrong', async () => {
    vi.mocked(changePassword).mockRejectedValue(apiError(403))
    const { user, dialog } = await openPasswordDialog()

    await user.type(dialog.getByLabelText('Senha atual'), 'chute')
    await user.type(dialog.getByLabelText('Nova senha'), 'nova-senha')
    await user.type(dialog.getByLabelText('Repita a nova senha'), 'nova-senha')
    await user.click(dialog.getByRole('button', { name: 'Trocar senha' }))

    expect(
      await dialog.findByText('A senha atual está incorreta.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
