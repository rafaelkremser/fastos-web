import { Link, useRouteError } from 'react-router'

import { PageTitle } from '@/components/page-title'

export function ErrorPage() {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : JSON.stringify(error)

  return (
    <>
      <PageTitle title="Erro" />
      <div className="flex h-screen flex-col items-center justify-center gap-2">
        <h1 className="text-4xl font-bold">Ops! Algo deu errado...</h1>
        <p className="text-accent-foreground">
          Não foi culpa sua. Abaixo estão mais detalhes:
        </p>
        <pre>{message}</pre>
        <p className="text-accent-foreground">
          Voltar para o{' '}
          <Link to="/" className="text-sky-500 dark:text-sky-400">
            início
          </Link>
        </p>
      </div>
    </>
  )
}
