import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { createCustomer } from '@/api/create-customer'
import { Dialog } from '@/components/ui/dialog'

import { apiError } from '../../../../test/api-error'
import { renderWithProviders } from '../../../../test/render-with-providers'
import { CustomerDialog } from './customer-dialog'

vi.mock('@/api/create-customer', () => ({ createCustomer: vi.fn() }))

function renderDialog(onSaved = vi.fn()) {
  renderWithProviders(
    <Dialog open>
      <CustomerDialog onSaved={onSaved} />
    </Dialog>,
  )

  return onSaved
}

async function fill(name: string, phone: string) {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Nome'), name)
  await user.type(screen.getByLabelText('Telefone'), phone)
  await user.click(screen.getByRole('button', { name: 'Cadastrar cliente' }))
}

describe('Customer Dialog', () => {
  it('should send the phone with digits only and blank fields as null', async () => {
    const saved = { id: 'c1', name: 'Maria Souza' }
    vi.mocked(createCustomer).mockResolvedValue(saved as never)
    const onSaved = renderDialog()

    await fill('Maria Souza', '(11) 98765-4321')

    expect(createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Maria Souza',
        phone: '11987654321',
        phone2: null,
        email: null,
        city: null,
      }),
    )
    expect(onSaved).toHaveBeenCalledWith(saved)
  })

  it('should ask for the area code', async () => {
    renderDialog()

    await fill('Maria Souza', '98765-4321')

    expect(
      await screen.findByText('Informe o telefone com DDD.'),
    ).toBeInTheDocument()
    expect(createCustomer).not.toHaveBeenCalled()
  })

  it('should point at the phone when another customer has it', async () => {
    vi.mocked(createCustomer).mockRejectedValue(apiError(409))
    const onSaved = renderDialog()

    await fill('Maria Souza', '11987654321')

    expect(
      await screen.findByText('Já existe um cliente com esse telefone.'),
    ).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
  })
})
