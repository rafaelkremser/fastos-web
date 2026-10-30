import {
  formatCompactMoney,
  formatDuration,
  formatShortDay,
  getAxisMax,
  getChange,
  getCurrentMonthName,
  getPreviousMonthName,
} from './metrics'

// Intl separates "R$" from the amount with a no-break space
const plain = (text: string) => text.replace(/\s/g, ' ')

describe('metrics helpers', () => {
  it('should write a day without its year', () => {
    expect(formatShortDay('2026-10-05')).toBe('05/10')
  })

  it('should name the previous month, across the turn of the year', () => {
    expect(getPreviousMonthName(new Date(2026, 9, 30))).toBe('setembro')
    expect(getPreviousMonthName(new Date(2026, 0, 15))).toBe('dezembro')
  })

  it("should name today's month", () => {
    expect(getCurrentMonthName(new Date(2026, 9, 30))).toBe('outubro')
  })

  it('should write a time in the unit that reads best', () => {
    expect(formatDuration(0.25)).toBe('15 min')
    expect(formatDuration(2.5)).toBe('2,5 h')
    expect(formatDuration(13.3)).toBe('13 h')
    expect(formatDuration(24)).toBe('1 dia')
    expect(formatDuration(72)).toBe('3 dias')
    expect(formatDuration(36)).toBe('1,5 dias')
  })

  it('should compare with the previous period in whole percents', () => {
    expect(getChange(929.9, 250)).toBe(272)
    expect(getChange(80, 100)).toBe(-20)
    expect(getChange(100, 100)).toBe(0)
    expect(getChange(100, 0)).toBeNull()
  })

  it('should round the top of the scale up to an easy number', () => {
    expect(getAxisMax(520)).toBe(600)
    expect(getAxisMax(1234)).toBe(1500)
    expect(getAxisMax(99.9)).toBe(100)
    expect(getAxisMax(7)).toBe(8)
    expect(getAxisMax(0)).toBe(0)
  })

  it('should shorten money for the axis', () => {
    expect(plain(formatCompactMoney(1500))).toBe('R$ 1,5 mil')
    expect(plain(formatCompactMoney(300))).toBe('R$ 300')
  })
})
