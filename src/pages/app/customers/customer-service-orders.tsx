import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { fetchServiceOrders } from '@/api/fetch-service-orders'
import { Pagination } from '@/components/pagination'
import { ServiceOrdersTable } from '@/components/service-orders-table'
import { Button } from '@/components/ui/button'

export function CustomerServiceOrders({ customerId }: { customerId: string }) {
  const [page, setPage] = useState(1)

  const { data: result } = useQuery({
    queryKey: ['service-orders', { page, customerId }],
    queryFn: () => fetchServiceOrders({ page, customerId }),
    placeholderData: keepPreviousData,
  })

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Ordens de serviço
        </h2>

        <Button variant="outline" size="sm" asChild>
          <Link to={`/service-orders/new?customerId=${customerId}`}>
            <Plus className="size-4" />
            Abrir OS
          </Link>
        </Button>
      </div>

      <ServiceOrdersTable
        serviceOrders={result?.serviceOrders}
        emptyMessage="Nenhuma OS para este cliente ainda."
        showCustomer={false}
      />

      {result && result.meta.totalCount > result.meta.perPage && (
        <Pagination
          page={result.meta.page}
          perPage={result.meta.perPage}
          totalCount={result.meta.totalCount}
          onPageChange={setPage}
        />
      )}
    </section>
  )
}
