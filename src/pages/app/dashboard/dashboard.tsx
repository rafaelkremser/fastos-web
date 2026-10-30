import { useQuery } from '@tanstack/react-query'
import {
  Banknote,
  BellRing,
  Hammer,
  Handshake,
  PackageCheck,
} from 'lucide-react'
import { Link } from 'react-router'

import { getOperationsMetrics } from '@/api/get-operations-metrics'
import { getRevenueMetrics } from '@/api/get-revenue-metrics'
import { PageTitle } from '@/components/page-title'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/hooks/use-current-user'
import { formatMoney } from '@/lib/format'
import { canSeeRevenue } from '@/lib/permissions'

import { ChangeNote } from './change-note'
import { MetricCard } from './metric-card'
import { RevenueChart } from './revenue-chart'
import { StatusBreakdown } from './status-breakdown'

// Where the panel opens. Everyone sees how the work stands; the owner and
// admins also see the money
export function Dashboard() {
  const { data: user } = useCurrentUser()
  const showRevenue = canSeeRevenue(user?.role)

  const { data: operations } = useQuery({
    queryKey: ['metrics', 'operations'],
    queryFn: getOperationsMetrics,
  })

  const { data: revenue } = useQuery({
    queryKey: ['metrics', 'revenue'],
    queryFn: getRevenueMetrics,
    enabled: showRevenue,
  })

  return (
    <>
      <PageTitle title="Início" />
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Início</h1>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            title="Em andamento"
            icon={Hammer}
            value={operations?.active}
          >
            {operations &&
              (operations.late > 0 ? (
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  {operations.late === 1
                    ? '1 atrasada'
                    : `${operations.late} atrasadas`}
                </span>
              ) : (
                'Nenhuma atrasada'
              ))}
          </MetricCard>

          <MetricCard
            title="Prontas para retirada"
            icon={PackageCheck}
            value={operations?.readyForPickup}
          >
            {operations && (
              <Link
                to="/service-orders?status=COMPLETED"
                className="hover:text-foreground hover:underline"
              >
                Ver a lista
              </Link>
            )}
          </MetricCard>

          <MetricCard
            title="Esperando aviso"
            icon={BellRing}
            value={operations?.needsCustomerNotice}
          >
            {operations &&
              (operations.needsCustomerNotice > 0 ? (
                <Link
                  to="/service-orders?needsCustomerNotice=true"
                  className="hover:text-foreground hover:underline"
                >
                  Avisar os clientes
                </Link>
              ) : (
                'Todos os clientes avisados'
              ))}
          </MetricCard>
        </div>

        {showRevenue && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <MetricCard
                title="Faturamento do mês"
                icon={Banknote}
                value={revenue && formatMoney(revenue.currentMonth.revenue)}
              >
                {revenue && (
                  <ChangeNote
                    current={revenue.currentMonth.revenue}
                    previous={revenue.previousMonth.revenue}
                  />
                )}
              </MetricCard>

              <MetricCard
                title="Entregas no mês"
                icon={Handshake}
                value={revenue?.currentMonth.delivered}
              >
                {revenue && (
                  <ChangeNote
                    current={revenue.currentMonth.delivered}
                    previous={revenue.previousMonth.delivered}
                  />
                )}
              </MetricCard>
            </div>

            <div className="lg:col-span-2">
              {revenue ? (
                <RevenueChart daily={revenue.daily} />
              ) : (
                <Skeleton className="h-80 w-full" />
              )}
            </div>
          </div>
        )}

        {operations ? (
          <StatusBreakdown byStatus={operations.byStatus} />
        ) : (
          <Skeleton className="h-72 w-full" />
        )}
      </div>
    </>
  )
}
