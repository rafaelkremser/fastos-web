import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'

import { changeServiceOrderStatus } from '@/api/change-service-order-status'
import { fetchServiceOrderHistory } from '@/api/fetch-service-order-history'
import { fetchUsers } from '@/api/fetch-users'
import { getCustomer } from '@/api/get-customer'
import { getDevice } from '@/api/get-device'
import { getServiceOrder } from '@/api/get-service-order'
import { getTenant } from '@/api/get-tenant'
import { getUser } from '@/api/get-user'
import { registerCustomerNotice } from '@/api/register-customer-notice'
import type { Customer, Device, UserRole } from '@/api/types'

import { makeServiceOrder, makeUser } from '../../../../test/factories'
import { renderWithProviders } from '../../../../test/render-with-providers'
import { ServiceOrderDetails } from './service-order-details'

vi.mock('@/api/change-service-order-status', () => ({
  changeServiceOrderStatus: vi.fn(),
}))
vi.mock('@/api/fetch-service-order-history', () => ({
  fetchServiceOrderHistory: vi.fn(),
}))
vi.mock('@/api/fetch-users', () => ({ fetchUsers: vi.fn() }))
vi.mock('@/api/get-customer', () => ({ getCustomer: vi.fn() }))
vi.mock('@/api/get-device', () => ({ getDevice: vi.fn() }))
vi.mock('@/api/get-service-order', () => ({ getServiceOrder: vi.fn() }))
vi.mock('@/api/get-tenant', () => ({ getTenant: vi.fn() }))
vi.mock('@/api/get-user', () => ({ getUser: vi.fn() }))
vi.mock('@/api/register-customer-notice', () => ({
  registerCustomerNotice: vi.fn(),
}))

const order = makeServiceOrder({
  status: 'IN_ANALYSIS',
  technicianId: 't1',
  discount: 20,
  items: [
    {
      id: 'i1',
      type: 'PART',
      description: 'Bateria original',
      quantity: 1,
      unitPrice: 189.9,
      totalPrice: 189.9,
      createdAt: '2026-10-20T12:00:00.000Z',
    },
  ],
  totalItemsCost: 189.9,
  totalWithDiscount: 169.9,
})

function renderAs(role: UserRole) {
  vi.mocked(getUser).mockResolvedValue(makeUser({ id: 'u1', role }))

  renderWithProviders(
    <Routes>
      <Route
        path="/service-orders/:serviceOrderId"
        element={<ServiceOrderDetails />}
      />
    </Routes>,
    { route: '/service-orders/so1' },
  )
}

// Intl separates "R$" from the amount with a no-break space
function money(text: string) {
  return (_: string, element: Element | null) =>
    element?.textContent?.replace(/\s/g, ' ') === text
}

beforeEach(() => {
  vi.mocked(getServiceOrder).mockResolvedValue(order)
  vi.mocked(getTenant).mockResolvedValue({
    name: 'Oficina Demo',
  } as Awaited<ReturnType<typeof getTenant>>)
  vi.mocked(getCustomer).mockResolvedValue({
    id: 'c1',
    name: 'Maria Souza',
    phone: '11987654321',
  } as Customer)
  vi.mocked(getDevice).mockResolvedValue({
    id: 'd1',
    type: 'SMARTPHONE',
    brand: 'Samsung',
    model: 'A54',
  } as Device)
  vi.mocked(fetchUsers).mockResolvedValue([
    makeUser({ id: 'u1', name: 'Rafaela Dona' }),
    makeUser({ id: 't1', name: 'Carlos Técnico', role: 'TECHNICIAN' }),
  ])
  vi.mocked(fetchServiceOrderHistory).mockResolvedValue([
    {
      id: 'h1',
      userId: 'u1',
      action: 'STATUS_CHANGED',
      description: 'Cliente deixou o carregador',
      oldValue: 'OPEN',
      newValue: 'IN_ANALYSIS',
      createdAt: '2026-10-21T12:00:00.000Z',
    },
  ])
})

// The ready device, still waiting for the customer to hear about it
const ready = makeServiceOrder({
  ...order,
  status: 'COMPLETED',
  needsCustomerNotice: true,
})

describe('Service Order Details', () => {
  it('should show the order with names, items and totals', async () => {
    renderAs('RECEPTIONIST')

    expect(
      await screen.findByRole('heading', { name: 'OS nº 12' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Maria Souza')).toBeInTheDocument()
    expect(screen.getByText('Celular Samsung A54')).toBeInTheDocument()
    expect(await screen.findAllByText('Carlos Técnico')).not.toHaveLength(0)
    expect(screen.getByText('Bateria original')).toBeInTheDocument()
    expect(screen.getByText(money('R$ 169,90'))).toBeInTheDocument()
  })

  it('should tell the history in Portuguese, with the note and who did it', async () => {
    renderAs('RECEPTIONIST')

    expect(
      await screen.findByText('Status: Aberta → Em análise'),
    ).toBeInTheDocument()
    expect(screen.getByText('Cliente deixou o carregador')).toBeInTheDocument()
    expect(await screen.findByText(/Rafaela Dona/)).toBeInTheDocument()
  })

  it('should show a notice in the history apart from its note', async () => {
    vi.mocked(fetchServiceOrderHistory).mockResolvedValue([
      {
        id: 'h2',
        userId: 'u1',
        action: 'CUSTOMER_NOTIFIED',
        description: 'Cliente avisado por telefone: Vai buscar amanhã',
        oldValue: null,
        newValue: 'PHONE',
        createdAt: '2026-10-28T15:30:00.000Z',
      },
    ])
    renderAs('RECEPTIONIST')

    expect(
      await screen.findByText('Cliente avisado por telefone'),
    ).toBeInTheDocument()
    expect(screen.getByText('Vai buscar amanhã')).toBeInTheDocument()
  })

  it('should offer each role only what it can do', async () => {
    renderAs('RECEPTIONIST')
    await screen.findByText('Bateria original')

    expect(screen.getByRole('button', { name: 'Mudar status' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Técnico' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Adicionar item' })).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Registrar aviso' }),
    ).toBeVisible()
  })

  it('should let a technician edit but not reassign', async () => {
    renderAs('TECHNICIAN')

    expect(
      await screen.findByRole('button', { name: 'Editar' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Adicionar item' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Técnico' })).toBeNull()
  })

  it('should suggest the next status and send it with the note', async () => {
    vi.mocked(changeServiceOrderStatus).mockResolvedValue(
      makeServiceOrder({ ...order, status: 'WAITING_APPROVAL' }),
    )
    const user = userEvent.setup()
    renderAs('OWNER')

    await user.click(
      await screen.findByRole('button', { name: 'Mudar status' }),
    )
    const dialog = screen.getByRole('dialog')
    await user.type(
      within(dialog).getByLabelText('Observação (opcional)'),
      'Orçamento enviado por WhatsApp',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Mudar status' }),
    )

    expect(changeServiceOrderStatus).toHaveBeenCalledWith(
      {
        serviceOrderId: 'so1',
        status: 'WAITING_APPROVAL',
        notes: 'Orçamento enviado por WhatsApp',
      },
      expect.anything(),
    )
  })

  it('should point out a pending notice, with the WhatsApp message written', async () => {
    vi.mocked(getServiceOrder).mockResolvedValue(ready)
    renderAs('RECEPTIONIST')

    const callout = within(
      await screen.findByRole('region', { name: 'Aviso ao cliente' }),
    )
    expect(
      callout.getByText('Pronta: falta avisar o cliente para retirar.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Ainda não avisado')).toBeInTheDocument()
    // The header's button gives way to the callout's
    expect(
      screen.getAllByRole('button', { name: 'Registrar aviso' }),
    ).toHaveLength(1)

    const link = await callout.findByRole('link', { name: 'Abrir WhatsApp' })
    const url = new URL(link.getAttribute('href')!)
    expect(url.origin + url.pathname).toBe('https://wa.me/5511987654321')
    expect(url.searchParams.get('text')?.replace(/\s/g, ' ')).toBe(
      'Olá, Maria! Aqui é da Oficina Demo. O seu celular Samsung A54 (OS nº 12) está pronto para retirada. O valor ficou em R$ 169,90.',
    )
    expect(link).toHaveAttribute('target', '_blank')

    // The test browser would really go to wa.me; the page's own click still runs
    link.addEventListener('click', (event) => event.preventDefault())
    await userEvent.setup().click(link)

    // Left waiting for when the person comes back from WhatsApp
    expect(
      screen.getByRole('dialog', { name: 'Registrar aviso' }),
    ).toBeInTheDocument()
  })

  it('should record the notice with the channel and the note', async () => {
    vi.mocked(getServiceOrder).mockResolvedValue(ready)
    vi.mocked(registerCustomerNotice).mockResolvedValue(
      makeServiceOrder({
        ...ready,
        needsCustomerNotice: false,
        customerNotifiedAt: '2026-10-28T15:30:00.000Z',
      }),
    )
    const user = userEvent.setup()
    renderAs('RECEPTIONIST')

    await user.click(
      await screen.findByRole('button', { name: 'Registrar aviso' }),
    )
    const dialog = screen.getByRole('dialog')
    await user.click(
      within(dialog).getByRole('combobox', { name: 'Como avisou' }),
    )
    await user.click(screen.getByRole('option', { name: 'Ligação' }))
    await user.type(
      within(dialog).getByLabelText('Observação (opcional)'),
      'Vai buscar amanhã',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Registrar aviso' }),
    )

    expect(registerCustomerNotice).toHaveBeenCalledWith(
      { serviceOrderId: 'so1', channel: 'PHONE', notes: 'Vai buscar amanhã' },
      expect.anything(),
    )
    // The page takes the order the API answered with
    expect(await screen.findByText(/^Avisado em /)).toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Aviso ao cliente' }),
    ).toBeNull()
  })
})
