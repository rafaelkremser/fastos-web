import type { StageTime } from '@/api/get-stage-times'
import { ServiceOrderStatus } from '@/components/service-order-status'
import { formatDuration } from '@/lib/metrics'

// How long orders stay in each stage, for the whole store and never per
// person: the longest bar is where work gets stuck. One color, like the
// status counts beside it
export function StageTimes({ stages }: { stages: StageTime[] }) {
  const longest = Math.max(1, ...stages.map((stage) => stage.medianHours ?? 0))

  return (
    <section
      aria-labelledby="stage-times-title"
      className="space-y-3 rounded-md border p-4"
    >
      <div>
        <h2 id="stage-times-title" className="font-semibold">
          Tempo em cada etapa
        </h2>
        <p className="text-sm text-muted-foreground">
          Quanto as OS costumam ficar em cada status, nos últimos 90 dias. Em
          "Pronta", é o tempo até o cliente buscar.
        </p>
      </div>

      <ul>
        {stages.map((stage) => (
          <li
            key={stage.status}
            className="grid grid-cols-[9.5rem_1fr_auto] items-center gap-3 px-2 py-1.5 text-sm sm:grid-cols-[11rem_1fr_auto]"
          >
            <ServiceOrderStatus status={stage.status} />
            <div aria-hidden className="h-2">
              <div
                className="h-full rounded-r-[4px] bg-chart-1"
                style={{
                  width: `${((stage.medianHours ?? 0) / longest) * 100}%`,
                }}
              />
            </div>
            <span className="text-right">
              {stage.medianHours === null ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <>
                  <span className="font-medium">
                    {formatDuration(stage.medianHours)}
                  </span>
                  <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                    {stage.stays === 1 ? '1 OS' : `${stage.stays} OS`}
                  </span>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
