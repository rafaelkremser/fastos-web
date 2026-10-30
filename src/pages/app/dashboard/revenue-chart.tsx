import { useRef, useState } from 'react'

import type { DailyDeliveredTotals } from '@/api/types'
import { formatMoney } from '@/lib/format'
import { formatCompactMoney, formatShortDay, getAxisMax } from '@/lib/metrics'
import { cn } from '@/lib/utils'

function describeDay({ day, delivered, revenue }: DailyDeliveredTotals) {
  const deliveries = delivered === 1 ? '1 entrega' : `${delivered} entregas`

  return `${formatShortDay(day)}: ${formatMoney(revenue)}, ${deliveries}`
}

// One bar per day. Each column is the hover and focus target, taller than the
// bar, and shows the day's numbers; the table under it has them all
export function RevenueChart({ daily }: { daily: DailyDeliveredTotals[] }) {
  const columns = useRef<(HTMLDivElement | null)[]>([])
  // The column the keyboard is on: the chart is one tab stop, and the arrows
  // move between days. Starts on today
  const [current, setCurrent] = useState(daily.length - 1)

  const top = getAxisMax(Math.max(...daily.map((day) => day.revenue)))

  function handleKeyDown(event: React.KeyboardEvent) {
    const moves: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: daily.length - 1,
    }
    const next = moves[event.key]

    if (next === undefined) {
      return
    }

    event.preventDefault()
    const index = Math.min(Math.max(next, 0), daily.length - 1)
    setCurrent(index)
    columns.current[index]?.focus()
  }

  return (
    <section
      aria-labelledby="revenue-chart-title"
      className="space-y-4 rounded-md border p-4"
    >
      <div>
        <h2 id="revenue-chart-title" className="font-semibold">
          Faturamento nos últimos 30 dias
        </h2>
        <p className="text-sm text-muted-foreground">
          Cada OS conta no dia em que foi entregue.
        </p>
      </div>

      {top === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma entrega nos últimos 30 dias.
        </p>
      ) : (
        <div className="flex gap-2">
          {/* The scale: the top, the middle and zero */}
          <div
            aria-hidden
            className="relative h-48 w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums"
          >
            {[top, top / 2, 0].map((tick) => (
              <span
                key={tick}
                className="absolute right-0 translate-y-1/2"
                style={{ bottom: `${(tick / top) * 100}%` }}
              >
                {formatCompactMoney(tick)}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="relative h-48">
              {[top, top / 2, 0].map((tick) => (
                <div
                  key={tick}
                  aria-hidden
                  className="absolute inset-x-0 border-t border-border"
                  style={{ bottom: `${(tick / top) * 100}%` }}
                />
              ))}

              <div
                role="group"
                aria-label="Faturamento por dia"
                onKeyDown={handleKeyDown}
                className="absolute inset-0 flex items-end gap-0.5"
              >
                {daily.map((day, index) => {
                  const height = (day.revenue / top) * 100

                  return (
                    <div
                      key={day.day}
                      ref={(element) => {
                        columns.current[index] = element
                      }}
                      // A plain div has no name for screen readers; as an
                      // image, each day is read as its numbers
                      role="img"
                      tabIndex={index === current ? 0 : -1}
                      aria-label={describeDay(day)}
                      onFocus={() => setCurrent(index)}
                      className="group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div
                        className="w-full max-w-6 rounded-t-[4px] bg-chart-1 group-hover:opacity-80 group-focus-visible:opacity-80"
                        style={{ height: `${height}%` }}
                      />

                      <div
                        aria-hidden
                        className={cn(
                          'pointer-events-none absolute z-10 hidden rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md group-hover:block group-focus-visible:block',
                          // Kept inside the card at both ends
                          index < 5
                            ? 'left-0'
                            : index > daily.length - 6
                              ? 'right-0'
                              : 'left-1/2 -translate-x-1/2',
                        )}
                        style={{ bottom: `calc(${height}% + 0.5rem)` }}
                      >
                        <div className="font-semibold">
                          {formatMoney(day.revenue)}
                        </div>
                        <div className="text-muted-foreground">
                          {formatShortDay(day.day)} ·{' '}
                          {day.delivered === 1
                            ? '1 entrega'
                            : `${day.delivered} entregas`}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* A label a week, ending on today */}
            <div
              aria-hidden
              className="flex h-4 gap-0.5 text-xs text-muted-foreground"
            >
              {daily.map((day, index) => (
                <div key={day.day} className="relative min-w-0 flex-1">
                  {(daily.length - 1 - index) % 7 === 0 && (
                    <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                      {formatShortDay(day.day)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <details className="pt-4 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Ver os números
        </summary>
        <table className="mt-2 w-full max-w-md text-left">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">Dia</th>
              <th className="py-1 text-right font-medium">Entregas</th>
              <th className="py-1 text-right font-medium">Faturamento</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {daily.map((day) => (
              <tr key={day.day} className="border-t">
                <td className="py-1">{formatShortDay(day.day)}</td>
                <td className="py-1 text-right">{day.delivered}</td>
                <td className="py-1 text-right">{formatMoney(day.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}
