import { useQuery } from '@tanstack/react-query'

import { fetchServiceOrderHistory } from '@/api/fetch-service-order-history'
import type { ServiceOrderHistoryEntry } from '@/api/types'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeam } from '@/hooks/use-team'
import { formatDateTime } from '@/lib/format'
import { getStatusLabel } from '@/lib/service-order'

// The API writes this when no note was given, with the statuses in English
const GENERIC_STATUS_DESCRIPTION = 'Status alterado de '

function describeEntry(entry: ServiceOrderHistoryEntry) {
  if (entry.action === 'STATUS_CHANGED') {
    const change = `Status: ${getStatusLabel(entry.oldValue ?? '')} → ${getStatusLabel(entry.newValue ?? '')}`
    const note = entry.description.startsWith(GENERIC_STATUS_DESCRIPTION)
      ? null
      : entry.description

    return { title: change, note }
  }

  // "Cliente avisado por WhatsApp: vai buscar amanhã", the note being optional
  if (entry.action === 'CUSTOMER_NOTIFIED') {
    const [title, ...note] = entry.description.split(': ')

    return { title, note: note.join(': ') || null }
  }

  return { title: entry.description, note: null }
}

export function ServiceOrderHistory({
  serviceOrderId,
}: {
  serviceOrderId: string
}) {
  const { getName } = useTeam()

  const { data: history } = useQuery({
    queryKey: ['service-order-history', serviceOrderId],
    queryFn: () => fetchServiceOrderHistory(serviceOrderId),
  })

  return (
    <section className="space-y-2.5">
      <h2 className="text-xl font-semibold tracking-tight">Histórico</h2>

      {!history && <Skeleton className="h-16 w-full" />}

      {history?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma mudança de status ou de técnico ainda.
        </p>
      )}

      <ol className="space-y-3 border-l pl-4">
        {history?.map((entry) => {
          const { title, note } = describeEntry(entry)

          return (
            <li key={entry.id} className="relative">
              <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-muted-foreground" />
              <div className="text-sm font-medium">{title}</div>
              {note && (
                <div className="text-sm whitespace-pre-line text-muted-foreground">
                  {note}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {formatDateTime(entry.createdAt)}
                {getName(entry.userId) && ` · ${getName(entry.userId)}`}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
