import { Link } from 'react-router'

import type { ServiceOrderStatus as Status } from '@/api/types'
import { ServiceOrderStatus } from '@/components/service-order-status'

// The orders still in the store: being worked on, or ready to pick up
const SHOWN: Status[] = [
  'OPEN',
  'IN_ANALYSIS',
  'WAITING_APPROVAL',
  'APPROVED',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'COMPLETED',
]

interface StatusBreakdownProps {
  byStatus: Record<Status, number>
}

// One bar per status, all in one color: the dot beside the name is what
// tells the statuses apart. Each row opens the list with that status
export function StatusBreakdown({ byStatus }: StatusBreakdownProps) {
  const highest = Math.max(1, ...SHOWN.map((status) => byStatus[status]))

  return (
    <section
      aria-labelledby="status-breakdown-title"
      className="space-y-3 rounded-md border p-4"
    >
      <div>
        <h2 id="status-breakdown-title" className="font-semibold">
          OS na loja
        </h2>
        <p className="text-sm text-muted-foreground">
          Por status. Clique para ver a lista.
        </p>
      </div>

      <ul>
        {SHOWN.map((status) => (
          <li key={status}>
            <Link
              to={`/service-orders?status=${status}`}
              className="grid grid-cols-[9.5rem_1fr_2rem] items-center gap-3 rounded-sm px-2 py-1.5 text-sm hover:bg-foreground/5 sm:grid-cols-[11rem_1fr_2rem]"
            >
              <ServiceOrderStatus status={status} />
              <div aria-hidden className="h-2">
                <div
                  className="h-full rounded-r-[4px] bg-chart-1"
                  style={{ width: `${(byStatus[status] / highest) * 100}%` }}
                />
              </div>
              <span className="text-right font-medium tabular-nums">
                {byStatus[status]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
