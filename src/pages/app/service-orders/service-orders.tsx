import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { z } from 'zod'

import { fetchServiceOrders } from '@/api/fetch-service-orders'
import type { ServiceOrderStatus } from '@/api/types'
import { PageTitle } from '@/components/page-title'
import { Pagination } from '@/components/pagination'
import { ServiceOrdersTable } from '@/components/service-orders-table'
import { Button } from '@/components/ui/button'
import { SERVICE_ORDER_STATUSES } from '@/lib/service-order'

import { ServiceOrderTableFilters } from './service-order-table-filters'

const positiveInteger = z.coerce.number().int().min(1)

export function ServiceOrders() {
  const [searchParams, setSearchParams] = useSearchParams()

  // A hand-edited address falls back to no filter instead of breaking
  const page = positiveInteger.catch(1).parse(searchParams.get('page') ?? '1')
  const number = positiveInteger
    .nullable()
    .catch(null)
    .parse(searchParams.get('number'))
  const statusParam = searchParams.get('status')
  const status = SERVICE_ORDER_STATUSES.some(
    (option) => option.value === statusParam,
  )
    ? (statusParam as ServiceOrderStatus)
    : null
  const technicianId = searchParams.get('technicianId')
  const needsCustomerNotice = searchParams.get('needsCustomerNotice') === 'true'

  const isFiltered = Boolean(number || status || technicianId)

  const { data: result } = useQuery({
    queryKey: [
      'service-orders',
      { page, number, status, technicianId, needsCustomerNotice },
    ],
    queryFn: () =>
      fetchServiceOrders({
        page,
        number,
        status,
        technicianId,
        needsCustomerNotice,
      }),
    placeholderData: keepPreviousData,
  })

  function handlePageChange(page: number) {
    setSearchParams((state) => {
      state.set('page', page.toString())

      return state
    })
  }

  return (
    <>
      <PageTitle title="Ordens de serviço" />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Ordens de serviço
          </h1>

          <Button asChild>
            <Link to="/service-orders/new">
              <Plus className="size-4" />
              Nova OS
            </Link>
          </Button>
        </div>

        <div className="space-y-2.5">
          <ServiceOrderTableFilters />

          <ServiceOrdersTable
            serviceOrders={result?.serviceOrders}
            emptyMessage={
              isFiltered
                ? 'Nenhuma OS com esses filtros.'
                : needsCustomerNotice
                  ? 'Nenhum cliente esperando aviso.'
                  : 'Nenhuma OS aberta ainda.'
            }
          />

          {result && (
            <Pagination
              page={result.meta.page}
              perPage={result.meta.perPage}
              totalCount={result.meta.totalCount}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </>
  )
}
