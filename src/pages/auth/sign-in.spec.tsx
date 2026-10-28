import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'

import { signIn } from '@/api/sign-in'
import { endSession, hasSession } from '@/lib/session'

import { apiError } from '../../../test/api-error'
import { renderWithProviders } from '../../../test/render-with-providers'
import { SignIn } from './sign-in'

vi.mock('@/api/sign-in', () => ({ signIn: vi.fn() }))

vi.mock('@/lib/tenant', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/tenant')>()),
  getCurrentTenantSlug: () => 'loja-a',
}))

function renderSignIn() {
  renderWithProviders(
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/" element={<p>Painel</p>} />
    </Routes>,
    { route: '/sign-in' },
  )
}

async function submit(email: string, password: string) {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('E-mail'), email)
  await user.type(screen.getByLabelText('Senha'), password)
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

afterEach(() => {
  endSession()
})

describe('Sign In', () => {
  it('should sign in to the store of the subdomain', async () => {
    vi.mocked(signIn).mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    })
    renderSignIn()

    await submit('maria@loja-a.com', '123456')

    expect(signIn).toHaveBeenCalledWith(
      {
        tenantSlug: 'loja-a',
        email: 'maria@loja-a.com',
        password: '123456',
      },
      // TanStack Query passes its own context as the second argument
      expect.anything(),
    )
    expect(await screen.findByText('Painel')).toBeInTheDocument()
    expect(hasSession()).toBe(true)
  })

  it('should say when the email or the password is wrong', async () => {
    vi.mocked(signIn).mockRejectedValue(apiError(401))
    renderSignIn()

    await submit('maria@loja-a.com', 'errada')

    expect(
      await screen.findByText('E-mail ou senha incorretos.'),
    ).toBeInTheDocument()
    expect(hasSession()).toBe(false)
  })

  it('should go straight to the panel when already signed in', async () => {
    localStorage.setItem('fastos-refresh-token', 'refresh-1')

    renderSignIn()

    expect(await screen.findByText('Painel')).toBeInTheDocument()
  })
})
