import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { registerTenant } from '@/api/register-tenant'

import { apiError } from '../../../test/api-error'
import { renderWithProviders } from '../../../test/render-with-providers'
import { SignUp } from './sign-up'

vi.mock('@/api/register-tenant', () => ({ registerTenant: vi.fn() }))

async function fillForm(fields: Record<string, string>) {
  const user = userEvent.setup()

  for (const [label, value] of Object.entries(fields)) {
    const input = screen.getByLabelText(label)
    await user.clear(input)
    await user.type(input, value)
  }

  await user.click(screen.getByRole('button', { name: 'Cadastrar loja' }))
}

const validForm = {
  'Nome da loja': 'Loja A',
  'Endereço da loja': 'loja-a',
  'E-mail da loja': 'contato@loja-a.com',
  'Seu nome': 'Maria Souza',
  'Seu e-mail': 'maria@loja-a.com',
  Senha: '123456',
}

describe('Sign Up', () => {
  it('should suggest the address from the store name', async () => {
    renderWithProviders(<SignUp />)

    await userEvent.type(
      screen.getByLabelText('Nome da loja'),
      'Assistência Técnica São João',
    )

    expect(screen.getByLabelText('Endereço da loja')).toHaveValue(
      'assistencia-tecnica-sao-joao',
    )
  })

  it('should stop suggesting once the address is edited', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignUp />)

    await user.type(screen.getByLabelText('Nome da loja'), 'Loja')
    await user.clear(screen.getByLabelText('Endereço da loja'))
    await user.type(screen.getByLabelText('Endereço da loja'), 'minha-loja')
    await user.type(screen.getByLabelText('Nome da loja'), ' do Centro')

    expect(screen.getByLabelText('Endereço da loja')).toHaveValue('minha-loja')
  })

  it('should not send a reserved address', async () => {
    renderWithProviders(<SignUp />)

    await fillForm({ ...validForm, 'Endereço da loja': 'admin' })

    expect(
      await screen.findByText('Esse endereço é reservado. Escolha outro.'),
    ).toBeInTheDocument()
    expect(registerTenant).not.toHaveBeenCalled()
  })

  it('should send the store and its owner, and say it waits for approval', async () => {
    vi.mocked(registerTenant).mockResolvedValue({
      name: 'Loja A',
      slug: 'loja-a',
      isActive: false,
    })
    const assign = vi
      .spyOn(window.location, 'assign')
      .mockImplementation(() => {})
    renderWithProviders(<SignUp />)

    await fillForm(validForm)

    expect(registerTenant).toHaveBeenCalledWith(
      {
        tenantName: 'Loja A',
        tenantSlug: 'loja-a',
        tenantEmail: 'contato@loja-a.com',
        tenantPhone: null,
        ownerName: 'Maria Souza',
        ownerEmail: 'maria@loja-a.com',
        ownerPassword: '123456',
      },
      // TanStack Query passes its own context as the second argument
      expect.anything(),
    )
    expect(await screen.findByText('Cadastro recebido!')).toBeInTheDocument()
    expect(assign).not.toHaveBeenCalled()
  })

  it("should send the owner to the store's sign-in when approval is automatic", async () => {
    vi.mocked(registerTenant).mockResolvedValue({
      name: 'Loja A',
      slug: 'loja-a',
      isActive: true,
    })
    const assign = vi
      .spyOn(window.location, 'assign')
      .mockImplementation(() => {})
    renderWithProviders(<SignUp />)

    await fillForm(validForm)

    expect(assign).toHaveBeenCalledWith(
      expect.stringMatching(/\/\/loja-a\.localhost(:\d+)?\/sign-in\?created$/),
    )
  })

  it('should point at the address when it is already in use', async () => {
    vi.mocked(registerTenant).mockRejectedValue(
      apiError(409, 'Tenant address "loja-a" is already in use.'),
    )
    renderWithProviders(<SignUp />)

    await fillForm(validForm)

    expect(
      await screen.findByText('Esse endereço já está em uso. Escolha outro.'),
    ).toBeInTheDocument()
  })

  it('should point at the email when a store already has it', async () => {
    vi.mocked(registerTenant).mockRejectedValue(
      apiError(409, 'Tenant "contato@loja-a.com" already exists.'),
    )
    renderWithProviders(<SignUp />)

    await fillForm(validForm)

    expect(
      await screen.findByText('Já existe uma loja com esse e-mail.'),
    ).toBeInTheDocument()
  })
})
