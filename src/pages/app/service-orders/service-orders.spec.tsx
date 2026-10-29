import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { fetchServiceOrders } from '@/api/fetch-service-orders'
import { fetchUsers } from '@/api/fetch-users'

import { makeServiceOrderSummary, makeUser } from '../../../../test/factories'
import { renderWithProviders } from '../../../../test/render-with-providers'
import { ServiceOrders } from './service-orders'

vi.mock('@/api/fetch-service-orders', () => ({ fetchServiceOrders: vi.fn() }))
vi.mock('@/api/fetch-users', () => ({ fetchUsers: vi.fn() }))

beforeEach(() => {
  vi.mocked(fetchUsers).mockResolvedValue([
    makeUser({ id: 't1', name: 'Carlos Técnico', role: 'TECHNICIAN' }),
  ])
  vi.mocked(fetchServiceOrders).mockResolvedValue({
    serviceOrders: [
      makeServiceOrderSummary({
        status: 'WAITING_PARTS',
        priority: 'URGENT',
        technician: { id: 't1', name: 'Carlos Técnico' },
      }),
    ],
    meta: { page: 1, perPage: 20, totalCount: 1 },
  })
})

describe('Service Orders', () => {
  it('should show each order with names, not ids', async () => {
    renderWithProviders(<ServiceOrders />, { route: '/service-orders' })

    await screen.findByText('Maria Souza')
    // The filters list the same statuses and technicians, so look in the table
    const table = within(screen.getByRole('table'))

    expect(table.getByText('Celular Samsung A54')).toBeInTheDocument()
    expect(table.getByText('Aguardando peças')).toBeInTheDocument()
    expect(table.getByText('Urgente')).toBeInTheDocument()
    expect(table.getByText('Carlos Técnico')).toBeInTheDocument()
  })

  it('should find an order by its number from the first page', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ServiceOrders />, {
      route: '/service-orders?page=3',
    })

    await user.type(screen.getByLabelText('Número da OS'), '42')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))

    await waitFor(() =>
      expect(fetchServiceOrders).toHaveBeenLastCalledWith({
        page: 1,
        number: 42,
        status: null,
        technicianId: null,
        needsCustomerNotice: false,
      }),
    )
  })

  it('should read the filters from the address', async () => {
    renderWithProviders(<ServiceOrders />, {
      route: '/service-orders?status=COMPLETED&technicianId=t1',
    })

    await screen.findByText('Maria Souza')

    expect(fetchServiceOrders).toHaveBeenCalledWith({
      page: 1,
      number: null,
      status: 'COMPLETED',
      technicianId: 't1',
      needsCustomerNotice: false,
    })
  })

  it('should list only the customers still waiting for a notice', async () => {
    vi.mocked(fetchServiceOrders).mockResolvedValue({
      serviceOrders: [
        makeServiceOrderSummary({
          status: 'COMPLETED',
          needsCustomerNotice: true,
        }),
      ],
      meta: { page: 1, perPage: 20, totalCount: 1 },
    })
    const user = userEvent.setup()
    renderWithProviders(<ServiceOrders />, {
      route: '/service-orders?page=2',
    })

    const table = within(await screen.findByRole('table'))
    expect(await table.findByText('Avisar cliente')).toBeInTheDocument()

    // Applies at once, without "Filtrar"
    const toggle = screen.getByRole('button', { name: 'Precisa avisar' })
    await user.click(toggle)

    await waitFor(() =>
      expect(fetchServiceOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, needsCustomerNotice: true }),
      ),
    )
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('should ignore a status that does not exist', async () => {
    renderWithProviders(<ServiceOrders />, {
      route: '/service-orders?status=XYZ',
    })

    await screen.findByText('Maria Souza')

    expect(fetchServiceOrders).toHaveBeenCalledWith(
      expect.objectContaining({ status: null }),
    )
  })
})
