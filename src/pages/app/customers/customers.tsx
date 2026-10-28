import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'

import { fetchCustomers } from '@/api/fetch-customers'
import { PageTitle } from '@/components/page-title'
import { Pagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatPhone } from '@/lib/format'

import { CustomerDialog } from './customer-dialog'
import { CustomerTableFilters } from './customer-table-filters'

export function Customers() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreating, setIsCreating] = useState(false)

  const search = searchParams.get('search') ?? ''
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .catch(1)
    .parse(searchParams.get('page') ?? '1')

  const { data: result } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => fetchCustomers({ page, search }),
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
      <PageTitle title="Clientes" />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>

          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Novo cliente
              </Button>
            </DialogTrigger>

            {/* A new customer usually comes in with a device, which is added on
                the customer's page */}
            <CustomerDialog
              onSaved={(customer) => navigate(`/customers/${customer.id}`)}
            />
          </Dialog>
        </div>

        <div className="space-y-2.5">
          <CustomerTableFilters />

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[160px]">Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="hidden w-[200px] lg:table-cell">
                    Cidade
                  </TableHead>
                  <TableHead className="hidden w-[120px] sm:table-cell">
                    Cliente desde
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!result &&
                  Array.from({ length: 5 }, (_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}

                {result?.customers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {search
                        ? 'Nenhum cliente com esse nome.'
                        : 'Nenhum cliente cadastrado ainda.'}
                    </TableCell>
                  </TableRow>
                )}

                {result?.customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>{formatPhone(customer.phone)}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {customer.email}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {[customer.city, customer.state]
                        .filter(Boolean)
                        .join('/')}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(customer.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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
