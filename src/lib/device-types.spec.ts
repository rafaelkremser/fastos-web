import { describeDevice } from './device-types'

describe('describeDevice', () => {
  it('should name the type in Portuguese, then brand and model', () => {
    expect(
      describeDevice({
        type: 'SMARTPHONE',
        brand: 'Samsung',
        model: 'Galaxy A54',
      }),
    ).toBe('Celular Samsung Galaxy A54')
  })

  it('should show an unknown type as it was saved', () => {
    expect(describeDevice({ type: 'Drone', brand: null, model: null })).toBe(
      'Drone',
    )
  })
})
