import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { signIn } from '@/api/sign-in'
import { FormError } from '@/components/form-error'
import { PageTitle } from '@/components/page-title'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from '@/hooks/use-session'
import { startSession } from '@/lib/session'
import { getCurrentTenantSlug, getPublicSiteUrl } from '@/lib/tenant'

const signInForm = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
})

type SignInForm = z.infer<typeof signInForm>

export function SignIn() {
  const isSignedIn = useSession()
  const [searchParams, setSearchParams] = useSearchParams()

  // This page only exists on a store's subdomain
  const tenantSlug = getCurrentTenantSlug() ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInForm),
  })

  const { mutateAsync: authenticate } = useMutation({
    mutationFn: signIn,
  })

  // The sign-up on the public site sends the new store here
  useEffect(() => {
    if (searchParams.has('created')) {
      toast.success(
        'Loja cadastrada! Entre com o e-mail e a senha que você criou.',
        {
          id: 'store-created',
        },
      )
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  if (isSignedIn) {
    return <Navigate to="/" replace />
  }

  async function handleSignIn(data: SignInForm) {
    try {
      // Once the session starts, this page re-renders and goes to the panel
      startSession(await authenticate({ tenantSlug, ...data }))
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined

      if (status === 401) {
        toast.error('E-mail ou senha incorretos.')
      } else if (status === 403) {
        // The API only says so when the email and password are right
        toast.warning(
          'Sua loja ainda está aguardando aprovação. Assim que ela for liberada, você já pode entrar.',
        )
      } else if (status === 429) {
        toast.error('Muitas tentativas. Aguarde um minuto e tente de novo.')
      } else {
        toast.error('Não foi possível entrar. Tente de novo.')
      }
    }
  }

  return (
    <>
      <PageTitle title="Login" />
      <div className="p-8">
        <div className="flex w-[320px] flex-col justify-center gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Acessar painel
            </h1>
            <p className="text-sm text-muted-foreground">
              Loja <span className="font-medium">{tenantSlug}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit(handleSignIn)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FormError message={errors.email?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              <FormError message={errors.password?.message} />
            </div>

            <Button disabled={isSubmitting} className="w-full" type="submit">
              Entrar
            </Button>
          </form>

          <div className="space-y-1 text-center text-xs text-muted-foreground">
            <p>
              Não é esta loja?{' '}
              <a href={getPublicSiteUrl('/sign-in')} className="underline">
                Acessar outra loja
              </a>
            </p>
            <p>
              Ainda não tem cadastro?{' '}
              <a href={getPublicSiteUrl('/sign-up')} className="underline">
                Cadastre sua loja
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
