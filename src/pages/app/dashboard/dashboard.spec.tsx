import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  getOperationsMetrics,
  type OperationsMetrics,
} from '@/api/get-operations-metrics'
import {
  getRevenueMetrics,
  type RevenueMetrics,
} from '@/api/get-revenue-metrics'
import { getUser } from '@/api/get-user'
import type { UserRole } from '@/api/types'

import { makeUser } from '../../../../test/factories'
import { renderWithProviders } from '../../../../test/render-with-providers'
import { Dashboard } from './dashboard'

vi.mock('@/api/get-operations-metrics', () => ({
  getOperationsMetrics: vi.fn(),
}))
vi.mock('@/api/get-revenue-metrics', () => ({ getRevenueMetrics: vi.fn() }))
vi.mock('@/api/get-user', () => ({ getUser: vi.fn() }))

const operations: OperationsMetrics = {
  byStatus: {
    OPEN: 0,
    IN_ANALYSIS: 0,
    WAITING_APPROVAL: 1,
    APPROVED: 0,
    IN_PROGRESS: 1,
    WAITING_PARTS: 1,
    COMPLETED: 2,
    DELIVERED: 7,
    CANCELLED: 0,
  },
  active: 3,
  late: 2,
  readyForPickup: 2,
  needsCustomerNotice: 3,
}

// The last 30 days up to October 30, with deliveries on three of them
function makeDaily() {
  return Array.from({ length: 30 }, (_, index) => {
    const day = `2026-10-${String(index + 1).padStart(2, '0')}`
    const revenue = { 15: 99.9, 28: 520, 30: 130 }[index + 1] ?? 0

    return { day, delivered: revenue ? 1 : 0, revenue }
  })
}

const revenue: RevenueMetrics = {
  currentMonth: { delivered: 3, revenue: 749.9 },
  previousMonth: { delivered: 1, revenue: 250 },
  daily: makeDaily(),
}

// Intl separates "R$" from the amount with a no-break space
function money(text: string) {
  return (_: string, element: Element | null) =>
    element?.textContent?.replace(/\s/g, ' ') === text &&
    !Array.from(element.children).some(
      (child) => child.textContent?.replace(/\s/g, ' ') === text,
    )
}

function renderAs(role: UserRole) {
  vi.mocked(getUser).mockResolvedValue(makeUser({ role }))

  renderWithProviders(<Dashboard />)
}

// The revenue cards appear once the user's role is known
async function findCard(title: string) {
  const heading = await screen.findByRole('heading', { name: title })

  return within(heading.closest('section')!)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 30, 12) })
  vi.mocked(getOperationsMetrics).mockResolvedValue(operations)
  vi.mocked(getRevenueMetrics).mockResolvedValue(revenue)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Dashboard', () => {
  it('should show how the work stands, with the late ones and the notices', async () => {
    renderAs('RECEPTIONIST')

    expect(await screen.findByText('2 atrasadas')).toBeInTheDocument()
    expect((await findCard('Em andamento')).getByText('3')).toBeInTheDocument()
    expect(
      (await findCard('Prontas para retirada')).getByText('2'),
    ).toBeInTheDocument()
    expect(
      (await findCard('Esperando aviso')).getByRole('link', {
        name: 'Avisar os clientes',
      }),
    ).toHaveAttribute('href', '/service-orders?needsCustomerNotice=true')
  })

  it('should open the list of each status', async () => {
    renderAs('TECHNICIAN')

    const statuses = within(
      await screen.findByRole('region', { name: 'OS na loja' }),
    )
    const waitingParts = statuses.getByRole('link', {
      name: /Aguardando peças/,
    })
    expect(waitingParts).toHaveAttribute(
      'href',
      '/service-orders?status=WAITING_PARTS',
    )
    expect(waitingParts).toHaveTextContent('1')
    // Delivered and cancelled orders are no longer in the store
    expect(statuses.queryByRole('link', { name: /Entregue/ })).toBeNull()
  })

  it('should keep the money from technicians and receptionists', async () => {
    renderAs('TECHNICIAN')
    await screen.findByText('2 atrasadas')

    expect(screen.queryByText('Faturamento do mês')).toBeNull()
    expect(getRevenueMetrics).not.toHaveBeenCalled()
  })

  it('should show the revenue against the same stretch of last month', async () => {
    renderAs('OWNER')

    const month = await findCard('Faturamento do mês')
    expect(await month.findByText(money('R$ 749,90'))).toBeInTheDocument()
    // 749.90 against 250.00
    expect(month.getByText('+200%')).toBeInTheDocument()
    expect(
      month.getByText(/sobre o mesmo período de setembro/),
    ).toBeInTheDocument()
    expect(
      (await findCard('Entregas no mês')).getByText('3'),
    ).toBeInTheDocument()
  })

  it('should tell each day in the chart and in the table', async () => {
    renderAs('ADMIN')

    const chart = within(
      await screen.findByRole('group', { name: 'Faturamento por dia' }),
    )
    // The keyboard starts on today, and the arrows walk back
    const today = chart.getByRole('img', { name: /^30\/10/ })
    expect(today).toHaveAttribute('tabindex', '0')
    // A single tab stop for the 30 days
    expect(
      chart.getAllByRole('img').filter((column) => column.tabIndex === 0),
    ).toHaveLength(1)
    expect(today).toHaveAccessibleName(/^30\/10: R\$\s130,00, 1 entrega$/)

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    today.focus()
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(chart.getByRole('img', { name: /^28\/10/ })).toHaveFocus()

    const table = within(screen.getByRole('table'))
    expect(table.getAllByRole('row')).toHaveLength(31)
    expect(table.getByText(money('R$ 520,00'))).toBeInTheDocument()
  })

  it('should say so when nothing was delivered lately', async () => {
    vi.mocked(getRevenueMetrics).mockResolvedValue({
      currentMonth: { delivered: 0, revenue: 0 },
      previousMonth: { delivered: 0, revenue: 0 },
      daily: makeDaily().map((day) => ({ ...day, delivered: 0, revenue: 0 })),
    })
    renderAs('OWNER')

    expect(
      await screen.findByText('Nenhuma entrega nos últimos 30 dias.'),
    ).toBeInTheDocument()
    expect(
      (await findCard('Faturamento do mês')).getByText(
        'Nada entregue no mesmo período de setembro',
      ),
    ).toBeInTheDocument()
  })
})
