import { PageTitle } from '@/components/page-title'
import { getCurrentTenantSlug } from '@/lib/tenant'

export function SignIn() {
  const tenantSlug = getCurrentTenantSlug()

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
        </div>
      </div>
    </>
  )
}
