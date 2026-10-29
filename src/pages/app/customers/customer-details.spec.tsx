import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'

import { deleteCustomer } from '@/api/delete-customer'
import { fetchCustomerDevices } from '@/api/fetch-customer-devices'
import { getCustomer } from '@/api/get-customer'
import { getUser, type UserRole } from '@/api/get-user'

import { apiError } from '../../../../test/api-error'
import { renderWithProviders } from '../../../../test/render-with-providers'
import { CustomerDetails } from './customer-details'

vi.mock('@/api/get-customer', () => ({ getCustomer: vi.fn() }))
vi.mock('@/api/get-user', () => ({ getUser: vi.fn() }))
vi.mock('@/api/fetch-customer-devices', () => ({
  fetchCustomerDevices: vi.fn(),
}))
vi.mock('@/api/delete-customer', () => ({ deleteCustomer: vi.fn() }))
// The customer's orders are on the page too; this spec is not about them
vi.mock('@/api/fetch-service-orders', () => ({
  fetchServiceOrders: vi.fn().mockResolvedValue({
    serviceOrders: [],
    meta: { page: 1, perPage: 20, totalCount: 0 },
  }),
}))

function renderAs(role: UserRole) {
  vi.mocked(getUser).mockResolvedValue({
    id: 'u1',
    name: 'Ana',
    email: 'ana@example.com',
    role,
    isActive: true,
    createdAt: '2026-10-01T12:00:00.000Z',
  })

  renderWithProviders(
    <Routes>
      <Route path="/customers/:customerId" element={<CustomerDetails />} />
      <Route path="/customers" element={<p>Lista de clientes</p>} />
    </Routes>,
    { route: '/customers/c1' },
  )
}

beforeEach(() => {
  vi.mocked(getCustomer).mockResolvedValue({
    id: 'c1',
    name: 'Maria Souza',
    phone: '11987654321',
    phone2: null,
    email: null,
    document: null,
    zipCode: null,
    address: 'Rua das Flores',
    addressNumber: '120',
    complement: null,
    neighborhood: null,
    city: 'Campinas',
    state: 'SP',
    notes: null,
    createdAt: '2026-10-20T12:00:00.000Z',
  })
  vi.mocked(fetchCustomerDevices).mockResolvedValue({
    devices: [
      {
        id: 'd1',
        customerId: 'c1',
        type: 'SMARTPHONE',
        brand: 'Samsung',
        model: 'Galaxy A54',
        serialNumber: null,
        imei: null,
        color: null,
        condition: null,
        accessories: null,
        notes: null,
        createdAt: '2026-10-20T12:00:00.000Z',
      },
    ],
    meta: { page: 1, perPage: 20, totalCount: 1 },
  })
})

async function confirmDelete() {
  const user = userEvent.setup()

  await user.click(await screen.findByRole('button', { name: 'Excluir' }))
  await user.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Excluir',
    }),
  )
}

describe('Customer Details', () => {
  it("should show the customer's data and devices", async () => {
    renderAs('RECEPTIONIST')

    expect(
      await screen.findByRole('heading', { name: 'Maria Souza' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Rua das Flores, 120 - Campinas/SP'),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Celular Samsung Galaxy A54'),
    ).toBeInTheDocument()
  })

  it('should not offer to delete to who cannot', async () => {
    renderAs('TECHNICIAN')

    await screen.findByText('Celular Samsung Galaxy A54')

    expect(screen.queryByRole('button', { name: 'Excluir' })).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Excluir aparelho' }),
    ).toBeNull()
  })

  it('should go back to the list after deleting', async () => {
    vi.mocked(deleteCustomer).mockResolvedValue()
    renderAs('OWNER')

    await confirmDelete()

    expect(await screen.findByText('Lista de clientes')).toBeInTheDocument()
  })

  it('should explain why a customer with service orders stays', async () => {
    vi.mocked(deleteCustomer).mockRejectedValue(apiError(409))
    renderAs('ADMIN')

    await confirmDelete()

    expect(
      await screen.findByText(
        'Este cliente tem ordens de serviço e não pode ser excluído.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Maria Souza' }),
    ).toBeInTheDocument()
  })
})
