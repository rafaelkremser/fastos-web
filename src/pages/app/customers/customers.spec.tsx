import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { fetchCustomers } from '@/api/fetch-customers'
import type { Customer } from '@/api/types'

import { renderWithProviders } from '../../../../test/render-with-providers'
import { Customers } from './customers'

vi.mock('@/api/fetch-customers', () => ({ fetchCustomers: vi.fn() }))

const maria: Customer = {
  id: 'c1',
  name: 'Maria Souza',
  phone: '11987654321',
  phone2: null,
  email: 'maria@example.com',
  document: null,
  zipCode: null,
  address: null,
  addressNumber: null,
  complement: null,
  neighborhood: null,
  city: 'Campinas',
  state: 'SP',
  notes: null,
  createdAt: '2026-10-20T12:00:00.000Z',
}

beforeEach(() => {
  vi.mocked(fetchCustomers).mockResolvedValue({
    customers: [maria],
    meta: { page: 1, perPage: 20, totalCount: 21 },
  })
})

describe('Customers', () => {
  it('should list the customers with the total of pages', async () => {
    renderWithProviders(<Customers />, { route: '/customers' })

    expect(await screen.findByText('Maria Souza')).toBeInTheDocument()
    expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
    expect(fetchCustomers).toHaveBeenCalledWith({ page: 1, search: '' })
  })

  it('should search by name from the first page', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Customers />, { route: '/customers?page=2' })

    await user.type(screen.getByLabelText('Buscar pelo nome'), 'maria')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    // The list refetches once the search lands in the address
    await waitFor(() =>
      expect(fetchCustomers).toHaveBeenLastCalledWith({
        page: 1,
        search: 'maria',
      }),
    )
  })

  it('should say when the search finds nobody', async () => {
    vi.mocked(fetchCustomers).mockResolvedValue({
      customers: [],
      meta: { page: 1, perPage: 20, totalCount: 0 },
    })

    renderWithProviders(<Customers />, { route: '/customers?search=zzz' })

    expect(
      await screen.findByText('Nenhum cliente com esse nome.'),
    ).toBeInTheDocument()
  })
})
