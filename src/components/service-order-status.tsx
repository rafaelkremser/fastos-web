import type { ServiceOrderStatus as Status } from '@/api/types'
import { getStatusLabel, SERVICE_ORDER_STATUSES } from '@/lib/service-order'
import { cn } from '@/lib/utils'

export function ServiceOrderStatus({ status }: { status: Status }) {
  const color = SERVICE_ORDER_STATUSES.find(
    (option) => option.value === status,
  )?.color

  return (
    <div className="flex items-center gap-2">
      <span
        data-testid="status-dot"
        className={cn('size-2 shrink-0 rounded-full', color)}
      />
      <span className="font-medium text-muted-foreground">
        {getStatusLabel(status)}
      </span>
    </div>
  )
}
