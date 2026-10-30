// "2026-10-15" -> "15/10". The API gives the day already in Brazil's time, so
// it is not turned into a Date
export function formatShortDay(day: string) {
  const [, month, date] = day.split('-')

  return `${date}/${month}`
}

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long' })

// The month before today's, as in "setembro"
export function getPreviousMonthName(today = new Date()) {
  return monthFormatter.format(
    new Date(today.getFullYear(), today.getMonth() - 1, 1),
  )
}

// Today's month, as in "outubro"
export function getCurrentMonthName(today = new Date()) {
  return monthFormatter.format(today)
}

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
})

// A time in hours, in the unit that reads best: "40 min", "2,5 h", "13 h",
// "3 dias"
export function formatDuration(hours: number) {
  if (hours < 1) {
    return `${Math.max(1, Math.round(hours * 60))} min`
  }

  if (hours < 24) {
    return `${decimalFormatter.format(hours < 10 ? hours : Math.round(hours))} h`
  }

  const days = Math.round((hours / 24) * 10) / 10

  return `${decimalFormatter.format(days)} ${days === 1 ? 'dia' : 'dias'}`
}

// How this period compares with the previous one, in whole percents. Null
// when there is nothing to compare with
export function getChange(current: number, previous: number) {
  if (previous === 0) {
    return null
  }

  return Math.round(((current - previous) / previous) * 100)
}

// The top of a chart's scale: the next round number above the highest value
// (520 -> 600, 1.234 -> 1.500), so the ticks are easy to read
export function getAxisMax(highest: number) {
  if (highest <= 0) {
    return 0
  }

  const magnitude = 10 ** Math.floor(Math.log10(highest))
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(
    (multiple) => multiple * magnitude >= highest,
  )!

  return step * magnitude
}

const compactMoneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

// For axis ticks: "R$ 1,5 mil"
export function formatCompactMoney(value: number) {
  return compactMoneyFormatter.format(value)
}
