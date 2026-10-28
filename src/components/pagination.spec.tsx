import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Pagination } from './pagination'

describe('Pagination', () => {
  it('should show the page out of the total pages', () => {
    render(
      <Pagination
        page={2}
        perPage={20}
        totalCount={45}
        onPageChange={() => {}}
      />,
    )

    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument()
    expect(screen.getByText('Total de 45 registro(s)')).toBeInTheDocument()
  })

  it('should move to the next and to the last page', async () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        page={2}
        perPage={20}
        totalCount={45}
        onPageChange={onPageChange}
      />,
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Próxima página' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Última página' }))

    expect(onPageChange.mock.calls).toEqual([[3], [3]])
  })

  it('should not go before the first or past the last page', () => {
    render(
      <Pagination
        page={1}
        perPage={20}
        totalCount={0}
        onPageChange={() => {}}
      />,
    )

    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Página anterior' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Próxima página' }),
    ).toBeDisabled()
  })
})
