import { PageTitle } from '@/components/page-title'

export function SignUp() {
  return (
    <>
      <PageTitle title="Cadastro" />
      <div className="p-8">
        <div className="flex w-[320px] flex-col justify-center gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Cadastre sua loja
            </h1>
            <p className="text-sm text-muted-foreground">
              Organize as ordens de serviço da sua assistência técnica.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
