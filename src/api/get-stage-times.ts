import { api } from '@/lib/axios'

import type { ServiceOrderStatus } from './types'

export interface StageTime {
  status: ServiceOrderStatus
  // Stays that ended in the last 90 days
  stays: number
  // Null without stays
  medianHours: number | null
}

// How long orders stay in each stage, for the whole store: only the owner
// and admins can see it
export async function getStageTimes() {
  const response = await api.get<{ stages: StageTime[] }>(
    '/metrics/stage-times',
  )

  return response.data.stages
}
