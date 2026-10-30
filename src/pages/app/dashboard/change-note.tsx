import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

import { getChange, getPreviousMonthName } from '@/lib/metrics'

interface ChangeNoteProps {
  current: number
  previous: number
}

// "+25% sobre o mesmo período de setembro". Up is good for both revenue and
// deliveries; the arrow and the sign say it without the color
export function ChangeNote({ current, previous }: ChangeNoteProps) {
  const month = getPreviousMonthName()
  const period = `o mesmo período de ${month}`
  const change = getChange(current, previous)

  if (change === null) {
    return <span>Nada entregue no mesmo período de {month}</span>
  }

  if (change === 0) {
    return (
      <span className="flex items-center gap-1">
        <Minus className="size-3" aria-hidden />
        Igual a {period}
      </span>
    )
  }

  const isUp = change > 0
  const Icon = isUp ? TrendingUp : TrendingDown

  return (
    // Inline, so a narrow card wraps it like a sentence
    <span>
      <span
        className={
          isUp
            ? 'mr-1 inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400'
            : 'mr-1 inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400'
        }
      >
        <Icon className="size-3" aria-hidden />
        {isUp ? '+' : '−'}
        {Math.abs(change)}%
      </span>
      sobre {period}
    </span>
  )
}
