import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { registerTenant } from '@/api/register-tenant'
import { FormError } from '@/components/form-error'
import { PageTitle } from '@/components/page-title'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { hasValidSlugFormat, isReservedSlug, slugify } from '@/lib/slug'
import { getTenantUrl } from '@/lib/tenant'

const signUpForm = z.object({
  tenantName: z.string().trim().min(2, 'Informe o nome da loja.'),
  tenantSlug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      hasValidSlugFormat,
      'Use de 3 a 63 letras minúsculas, números e hífens, sem hífen no começo ou no fim.',
    )
    .refine(
      (slug) => !isReservedSlug(slug),
      'Esse endereço é reservado. Escolha outro.',
    ),
  tenantEmail: z.email('Informe um e-mail válido.'),
  tenantPhone: z.string().trim(),
  ownerName: z.string().trim().min(2, 'Informe o seu nome.'),
  ownerEmail: z.email('Informe um e-mail válido.'),
  ownerPassword: z
    .string()
    .min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
})

type SignUpFormInput = z.input<typeof signUpForm>
type SignUpForm = z.output<typeof signUpForm>

export function SignUp() {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<SignUpFormInput, unknown, SignUpForm>({
    resolver: zodResolver(signUpForm),
    defaultValues: {
      tenantName: '',
      tenantSlug: '',
      tenantEmail: '',
      tenantPhone: '',
      ownerName: '',
      ownerEmail: '',
      ownerPassword: '',
    },
  })

  const tenantSlug = useWatch({ control, name: 'tenantSlug' })
  const tenantHost = new URL(getTenantUrl(tenantSlug || 'sua-loja')).host

  const { mutateAsync: registerTenantFn } = useMutation({
    mutationFn: registerTenant,
  })

  async function handleSignUp(data: SignUpForm) {
    try {
      await registerTenantFn({
        ...data,
        tenantPhone: data.tenantPhone || null,
      })

      // The store has its own address now; sign in there
      window.location.assign(getTenantUrl(data.tenantSlug, '/sign-in?created'))
    } catch (error) {
      const response = isAxiosError<{ message?: string }>(error)
        ? error.response
        : undefined

      // Both conflicts are a 409; only the message tells them apart
      if (
        response?.status === 409 &&
        response.data.message?.includes('address')
      ) {
        setError('tenantSlug', {
          message: 'Esse endereço já está em uso. Escolha outro.',
        })
      } else if (response?.status === 409) {
        setError('tenantEmail', {
          message: 'Já existe uma loja com esse e-mail.',
        })
      } else if (response?.status === 429) {
        toast.error('Muitos cadastros feitos desta rede. Tente mais tarde.')
      } else {
        toast.error('Não foi possível cadastrar a loja. Tente de novo.')
      }
    }
  }

  return (
    <>
      <PageTitle title="Cadastro" />
      <div className="p-8">
        <div className="flex w-full max-w-[360px] flex-col justify-center gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Cadastre sua loja
            </h1>
            <p className="text-sm text-muted-foreground">
              Organize as ordens de serviço da sua assistência técnica.
            </p>
          </div>

          <form onSubmit={handleSubmit(handleSignUp)} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">Sua loja</h2>

              <div className="space-y-2">
                <Label htmlFor="tenantName">Nome da loja</Label>
                <Input
                  id="tenantName"
                  aria-invalid={!!errors.tenantName}
                  {...register('tenantName', {
                    // Suggests the address from the name until it is edited
                    onChange: (event) => {
                      if (!dirtyFields.tenantSlug) {
                        setValue('tenantSlug', slugify(event.target.value))
                      }
                    },
                  })}
                />
                <FormError message={errors.tenantName?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantSlug">Endereço da loja</Label>
                <Input
                  id="tenantSlug"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={!!errors.tenantSlug}
                  aria-describedby="tenantSlug-host"
                  {...register('tenantSlug')}
                />
                <p
                  id="tenantSlug-host"
                  className="text-xs text-muted-foreground"
                >
                  Sua loja vai abrir em{' '}
                  <span className="font-medium text-foreground">
                    {tenantHost}
                  </span>
                  . Não será possível mudar depois.
                </p>
                <FormError message={errors.tenantSlug?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantEmail">E-mail da loja</Label>
                <Input
                  id="tenantEmail"
                  type="email"
                  aria-invalid={!!errors.tenantEmail}
                  {...register('tenantEmail')}
                />
                <FormError message={errors.tenantEmail?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantPhone">Telefone da loja (opcional)</Label>
                <Input
                  id="tenantPhone"
                  type="tel"
                  {...register('tenantPhone')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold">Seu acesso</h2>

              <div className="space-y-2">
                <Label htmlFor="ownerName">Seu nome</Label>
                <Input
                  id="ownerName"
                  autoComplete="name"
                  aria-invalid={!!errors.ownerName}
                  {...register('ownerName')}
                />
                <FormError message={errors.ownerName?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Seu e-mail</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.ownerEmail}
                  {...register('ownerEmail')}
                />
                <FormError message={errors.ownerEmail?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerPassword">Senha</Label>
                <Input
                  id="ownerPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.ownerPassword}
                  {...register('ownerPassword')}
                />
                <FormError message={errors.ownerPassword?.message} />
              </div>
            </div>

            <Button disabled={isSubmitting} className="w-full" type="submit">
              Cadastrar loja
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Já tem uma loja?{' '}
            <Link to="/sign-in" className="underline">
              Acesse aqui
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
