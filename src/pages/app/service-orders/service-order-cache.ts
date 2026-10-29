import type { QueryClient } from '@tanstack/react-query'

import type { ServiceOrder } from '@/api/types'

// After a change the API answers with the whole order: the page shows it at
// once, and the lists and the history fetch again
export function updateServiceOrderCache(
  queryClient: QueryClient,
  serviceOrder: ServiceOrder,
) {
  queryClient.setQueryData(['service-order', serviceOrder.id], serviceOrder)
  queryClient.invalidateQueries({ queryKey: ['service-orders'] })
  queryClient.invalidateQueries({
    queryKey: ['service-order-history', serviceOrder.id],
  })
}
