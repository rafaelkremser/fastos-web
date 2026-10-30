import type { LucideIcon } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'

interface MetricCardProps {
  title: string
  icon: LucideIcon
  // Still loading while undefined
  value: React.ReactNode | undefined
  // The line under the value
  children?: React.ReactNode
}

export function MetricCard({
  title,
  icon: Icon,
  value,
  children,
}: MetricCardProps) {
  return (
    <section className="space-y-2 rounded-md border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>

      {value === undefined ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      )}

      {children && (
        <div className="text-xs text-muted-foreground">{children}</div>
      )}
    </section>
  )
}
