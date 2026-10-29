import { BellRing, Search, X } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTeam } from '@/hooks/use-team'
import { onlyDigits } from '@/lib/format'
import { SERVICE_ORDER_STATUSES } from '@/lib/service-order'

interface ServiceOrderFiltersForm {
  number: string
  status: string
  technicianId: string
}

// The selects need a value for "no filter"
const ALL = 'all'

export function ServiceOrderTableFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { technicians } = useTeam()
  const needsCustomerNotice = searchParams.get('needsCustomerNotice') === 'true'

  // The counter's to-do list: one click, no need to press "Filtrar"
  function handleToggleNeedsNotice() {
    setSearchParams((state) => {
      if (needsCustomerNotice) {
        state.delete('needsCustomerNotice')
      } else {
        state.set('needsCustomerNotice', 'true')
      }

      state.set('page', '1')

      return state
    })
  }

  const { register, handleSubmit, control, reset } =
    useForm<ServiceOrderFiltersForm>({
      defaultValues: {
        number: searchParams.get('number') ?? '',
        status: searchParams.get('status') ?? ALL,
        technicianId: searchParams.get('technicianId') ?? ALL,
      },
    })

  function handleFilter({
    number,
    status,
    technicianId,
  }: ServiceOrderFiltersForm) {
    setSearchParams((state) => {
      const filters = {
        number: onlyDigits(number),
        status: status === ALL ? '' : status,
        technicianId: technicianId === ALL ? '' : technicianId,
      }

      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          state.set(key, value)
        } else {
          state.delete(key)
        }
      }

      state.set('page', '1')

      return state
    })
  }

  function handleClearFilters() {
    setSearchParams((state) => {
      state.delete('number')
      state.delete('status')
      state.delete('technicianId')
      state.delete('needsCustomerNotice')
      state.set('page', '1')

      return state
    })

    reset({ number: '', status: ALL, technicianId: ALL })
  }

  return (
    <form
      onSubmit={handleSubmit(handleFilter)}
      className="flex flex-wrap items-center gap-2"
    >
      <Input
        placeholder="Nº da OS"
        aria-label="Número da OS"
        inputMode="numeric"
        className="h-8 w-28"
        {...register('number')}
      />

      <Controller
        name="status"
        control={control}
        render={({ field: { name, onChange, value } }) => (
          <Select name={name} value={value} onValueChange={onChange}>
            <SelectTrigger size="sm" className="w-48" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os status</SelectItem>
              {SERVICE_ORDER_STATUSES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      <Controller
        name="technicianId"
        control={control}
        render={({ field: { name, onChange, value } }) => (
          <Select name={name} value={value} onValueChange={onChange}>
            <SelectTrigger size="sm" className="w-48" aria-label="Técnico">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os técnicos</SelectItem>
              {technicians.map((technician) => (
                <SelectItem key={technician.id} value={technician.id}>
                  {technician.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      <Button type="submit" variant="secondary" size="sm">
        <Search className="size-4" />
        Filtrar
      </Button>

      <Button
        onClick={handleClearFilters}
        type="button"
        variant="outline"
        size="sm"
      >
        <X className="size-4" />
        Limpar
      </Button>

      <Button
        onClick={handleToggleNeedsNotice}
        type="button"
        variant={needsCustomerNotice ? 'default' : 'outline'}
        size="sm"
        aria-pressed={needsCustomerNotice}
      >
        <BellRing className="size-4" />
        Precisa avisar
      </Button>
    </form>
  )
}
