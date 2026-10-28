import { Search, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CustomerFiltersForm {
  search: string
}

export function CustomerTableFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const { register, handleSubmit, reset } = useForm<CustomerFiltersForm>({
    defaultValues: { search: searchParams.get('search') ?? '' },
  })

  function handleFilter({ search }: CustomerFiltersForm) {
    setSearchParams((state) => {
      if (search.trim()) {
        state.set('search', search.trim())
      } else {
        state.delete('search')
      }

      state.set('page', '1')

      return state
    })
  }

  function handleClearFilters() {
    setSearchParams((state) => {
      state.delete('search')
      state.set('page', '1')

      return state
    })

    reset({ search: '' })
  }

  return (
    <form
      onSubmit={handleSubmit(handleFilter)}
      className="flex flex-wrap items-center gap-2"
    >
      <Input
        placeholder="Buscar pelo nome"
        aria-label="Buscar pelo nome"
        className="h-8 w-full sm:w-[320px]"
        {...register('search')}
      />

      <Button type="submit" variant="secondary" size="sm">
        <Search className="size-4" />
        Buscar
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
    </form>
  )
}
