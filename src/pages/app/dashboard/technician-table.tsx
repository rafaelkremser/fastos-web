import { Link } from 'react-router'

import type {
  TechnicianMetrics,
  TechnicianNumbers,
} from '@/api/get-technician-metrics'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/format'
import { getCurrentMonthName } from '@/lib/metrics'
import { cn } from '@/lib/utils'

interface TechnicianTableProps {
  technicians: TechnicianMetrics[]
  unassigned: TechnicianNumbers
}

function NumberCells({ numbers }: { numbers: TechnicianNumbers }) {
  return (
    <>
      <TableCell className="text-right">{numbers.active}</TableCell>
      <TableCell
        className={cn(
          'text-right',
          numbers.late > 0 && 'font-medium text-rose-600 dark:text-rose-400',
        )}
      >
        {numbers.late}
      </TableCell>
      <TableCell className="text-right">{numbers.completed}</TableCell>
      <TableCell className="text-right">{numbers.delivered}</TableCell>
      <TableCell className="text-right">
        {formatMoney(numbers.revenue)}
      </TableCell>
    </>
  )
}

// One row per technician, and the orders nobody took. A table and not a
// chart: several numbers per person, each in its own scale
export function TechnicianTable({
  technicians,
  unassigned,
}: TechnicianTableProps) {
  const hasUnassigned = Object.values(unassigned).some((value) => value > 0)

  return (
    <section
      aria-labelledby="technicians-title"
      className="space-y-3 rounded-md border p-4"
    >
      <div>
        <h2 id="technicians-title" className="font-semibold">
          Por técnico
        </h2>
        <p className="text-sm text-muted-foreground">
          Em andamento e atrasadas agora; concluídas, entregues e faturamento em{' '}
          {getCurrentMonthName()}.
        </p>
      </div>

      {technicians.length === 0 && !hasUnassigned ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Ninguém na equipe pega OS ainda.
        </p>
      ) : (
        // The table scrolls sideways inside the card on a phone
        <Table className="tabular-nums">
          <TableHeader>
            <TableRow>
              <TableHead>Técnico</TableHead>
              <TableHead className="text-right">Em andamento</TableHead>
              <TableHead className="text-right">Atrasadas</TableHead>
              <TableHead className="text-right">Concluídas</TableHead>
              <TableHead className="text-right">Entregues</TableHead>
              <TableHead className="text-right">Faturamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technicians.map((technician) => (
              <TableRow key={technician.technicianId}>
                <TableCell className="font-medium">
                  <Link
                    to={`/service-orders?technicianId=${technician.technicianId}`}
                    className="hover:underline"
                  >
                    {technician.name}
                  </Link>
                </TableCell>
                <NumberCells numbers={technician} />
              </TableRow>
            ))}

            {hasUnassigned && (
              <TableRow className="text-muted-foreground">
                <TableCell>Sem técnico</TableCell>
                <NumberCells numbers={unassigned} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
