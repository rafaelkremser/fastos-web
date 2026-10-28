import { CircleCheck } from 'lucide-react'

import { PageTitle } from '@/components/page-title'
import { getTenantUrl } from '@/lib/tenant'

interface RegistrationReceivedProps {
  tenant: {
    name: string
    slug: string
  }
}

export function RegistrationReceived({ tenant }: RegistrationReceivedProps) {
  const signInUrl = getTenantUrl(tenant.slug, '/sign-in')

  return (
    <>
      <PageTitle title="Cadastro recebido" />
      <div className="p-8">
        <div className="flex w-full max-w-[360px] flex-col items-center gap-4 text-center">
          <CircleCheck className="size-10 text-emerald-500" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Cadastro recebido!
          </h1>
          <p className="text-sm text-muted-foreground">
            A loja{' '}
            <span className="font-medium text-foreground">{tenant.name}</span>{' '}
            está aguardando aprovação. Vamos entrar em contato pelos dados que
            você informou.
          </p>
          <p className="text-sm text-muted-foreground">
            Depois de liberada, ela abre em{' '}
            <a
              href={signInUrl}
              className="font-medium text-foreground underline"
            >
              {new URL(signInUrl).host}
            </a>
            , com o e-mail e a senha que você cadastrou.
          </p>
        </div>
      </div>
    </>
  )
}
