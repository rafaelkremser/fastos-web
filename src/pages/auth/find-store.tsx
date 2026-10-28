import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'

import { FormError } from '@/components/form-error'
import { PageTitle } from '@/components/page-title'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { hasValidSlugFormat } from '@/lib/slug'
import { getTenantUrl } from '@/lib/tenant'

const findStoreForm = z.object({
  tenantSlug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      hasValidSlugFormat,
      'Informe o endereço da loja, como "minha-loja".',
    ),
})

type FindStoreFormInput = z.input<typeof findStoreForm>
type FindStoreForm = z.output<typeof findStoreForm>

// Sign-in on the public site: asks for the store and sends the person to its
// subdomain, where the store's own sign-in asks for email and password
export function FindStore() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FindStoreFormInput, unknown, FindStoreForm>({
    resolver: zodResolver(findStoreForm),
  })

  function handleFindStore({ tenantSlug }: FindStoreForm) {
    window.location.assign(getTenantUrl(tenantSlug, '/sign-in'))
  }

  return (
    <>
      <PageTitle title="Acessar loja" />
      <div className="p-8">
        <div className="flex w-[320px] flex-col justify-center gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Acessar sua loja
            </h1>
            <p className="text-sm text-muted-foreground">
              Informe o endereço que você escolheu no cadastro.
            </p>
          </div>

          <form onSubmit={handleSubmit(handleFindStore)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantSlug">Endereço da loja</Label>
              <Input
                id="tenantSlug"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="minha-loja"
                aria-invalid={!!errors.tenantSlug}
                {...register('tenantSlug')}
              />
              <FormError message={errors.tenantSlug?.message} />
            </div>

            <Button disabled={isSubmitting} className="w-full" type="submit">
              Continuar
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Ainda não tem cadastro?{' '}
            <Link to="/sign-up" className="underline">
              Cadastre sua loja
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
