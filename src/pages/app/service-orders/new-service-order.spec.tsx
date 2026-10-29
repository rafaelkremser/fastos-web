import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'

import { createDevice } from '@/api/create-device'
import { createServiceOrder } from '@/api/create-service-order'
import { fetchCustomerDevices } from '@/api/fetch-customer-devices'
import { fetchCustomers } from '@/api/fetch-customers'
import { getCustomer } from '@/api/get-customer'
import type { Customer, Device } from '@/api/types'

import { makeServiceOrder } from '../../../../test/factories'
import { renderWithProviders } from '../../../../test/render-with-providers'
import { NewServiceOrder } from './new-service-order'

vi.mock('@/api/create-device', () => ({ createDevice: vi.fn() }))
vi.mock('@/api/create-service-order', () => ({ createServiceOrder: vi.fn() }))
vi.mock('@/api/fetch-customer-devices', () => ({
  fetchCustomerDevices: vi.fn(),
}))
vi.mock('@/api/fetch-customers', () => ({ fetchCustomers: vi.fn() }))
vi.mock('@/api/get-customer', () => ({ getCustomer: vi.fn() }))

const maria = {
  id: 'c1',
  name: 'Maria Souza',
  phone: '11987654321',
} as Customer

const phone = {
  id: 'd1',
  customerId: 'c1',
  type: 'SMARTPHONE',
  brand: 'Samsung',
  model: 'A54',
  color: 'Preto',
  imei: null,
  serialNumber: null,
} as Device

function renderPage(route: string) {
  renderWithProviders(
    <Routes>
      <Route path="/service-orders/new" element={<NewServiceOrder />} />
      <Route path="/service-orders/:id" element={<p>Página da OS</p>} />
    </Routes>,
    { route },
  )
}

beforeEach(() => {
  vi.mocked(getCustomer).mockResolvedValue(maria)
  vi.mocked(fetchCustomerDevices).mockResolvedValue({
    devices: [phone],
    meta: { page: 1, perPage: 20, totalCount: 1 },
  })
})

describe('New Service Order', () => {
  it('should find the customer by name before anything else', async () => {
    vi.mocked(fetchCustomers).mockResolvedValue({
      customers: [maria],
      meta: { page: 1, perPage: 20, totalCount: 1 },
    })
    const user = userEvent.setup()
    renderPage('/service-orders/new')

    await user.type(screen.getByLabelText('Buscar cliente pelo nome'), 'mar')
    await user.click(await screen.findByRole('button', { name: /Maria Souza/ }))

    expect(
      await screen.findByRole('radio', { name: /Celular Samsung A54/ }),
    ).toBeInTheDocument()
  })

  it('should open the order for the chosen device', async () => {
    vi.mocked(createServiceOrder).mockResolvedValue(
      makeServiceOrder({ id: 'so9', number: 9 }),
    )
    const user = userEvent.setup()
    renderPage('/service-orders/new?customerId=c1')

    await user.click(
      await screen.findByRole('radio', { name: /Celular Samsung A54/ }),
    )
    await user.type(
      screen.getByLabelText('O que o cliente relatou'),
      'Não liga, mesmo no carregador',
    )
    await user.click(screen.getByRole('button', { name: 'Abrir OS' }))

    expect(createServiceOrder).toHaveBeenCalledWith(
      {
        customerId: 'c1',
        deviceId: 'd1',
        problemDescription: 'Não liga, mesmo no carregador',
        priority: 'NORMAL',
        estimatedDate: null,
        internalNotes: null,
      },
      expect.anything(),
    )
    expect(await screen.findByText('Página da OS')).toBeInTheDocument()
  })

  it('should ask for the device and a real description', async () => {
    const user = userEvent.setup()
    renderPage('/service-orders/new?customerId=c1')

    await screen.findByText('Maria Souza')
    await user.type(screen.getByLabelText('O que o cliente relatou'), 'quebrou')
    await user.click(screen.getByRole('button', { name: 'Abrir OS' }))

    expect(await screen.findByText('Escolha o aparelho.')).toBeInTheDocument()
    expect(
      screen.getByText('Descreva o problema com pelo menos 10 caracteres.'),
    ).toBeInTheDocument()
    expect(createServiceOrder).not.toHaveBeenCalled()
  })

  it('should register a new device without opening the order', async () => {
    vi.mocked(createDevice).mockResolvedValue({
      ...phone,
      id: 'd2',
      type: 'NOTEBOOK',
      brand: 'Lenovo',
      model: 'IdeaPad 3',
    })
    const user = userEvent.setup()
    renderPage('/service-orders/new?customerId=c1')

    // A filled-in order, so a stray submit would really open it
    await user.click(
      await screen.findByRole('radio', { name: /Celular Samsung A54/ }),
    )
    await user.type(
      screen.getByLabelText('O que o cliente relatou'),
      'Não liga, mesmo no carregador',
    )
    await user.click(screen.getByRole('button', { name: 'Novo aparelho' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('combobox', { name: 'Tipo' }))
    await user.click(screen.getByRole('option', { name: 'Notebook' }))
    await user.click(
      within(dialog).getByRole('button', { name: 'Cadastrar aparelho' }),
    )

    expect(createDevice).toHaveBeenCalled()
    // The device dialog submits its own form only, not the order's
    expect(createServiceOrder).not.toHaveBeenCalled()
  })

  it('should come with the device chosen from the device list', async () => {
    renderPage('/service-orders/new?customerId=c1&deviceId=d1')

    expect(
      await screen.findByRole('radio', { name: /Celular Samsung A54/ }),
    ).toHaveAttribute('aria-checked', 'true')
  })
})
