import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { NavLink } from './nav-link'

describe('NavLink', () => {
  it('should highlight the link of the current page', () => {
    const wrapper = render(
      <>
        <NavLink to="/">Início</NavLink>
        <NavLink to="/service-orders">Ordens de serviço</NavLink>
      </>,
      {
        wrapper: ({ children }) => (
          <MemoryRouter initialEntries={['/service-orders']}>
            {children}
          </MemoryRouter>
        ),
      },
    )

    expect(wrapper.getByText('Início').dataset.current).toEqual('false')
    expect(wrapper.getByText('Ordens de serviço').dataset.current).toEqual(
      'true',
    )
  })
})
