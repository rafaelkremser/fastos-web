import { api } from '@/lib/axios'

import type { DailyDeliveredTotals, DeliveredTotals } from './types'

export interface RevenueMetrics {
  // From the first day of this month until now
  currentMonth: DeliveredTotals
  // The same stretch of the month before
  previousMonth: DeliveredTotals
  // Each of the last 30 days, today last
  daily: DailyDeliveredTotals[]
}

// What the store took in: orders count on the day they are delivered. Only
// the owner and admins can see it
export async function getRevenueMetrics() {
  const response = await api.get<{ metrics: RevenueMetrics }>(
    '/metrics/revenue',
  )

  return response.data.metrics
}
