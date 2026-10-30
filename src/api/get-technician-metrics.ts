import { api } from '@/lib/axios'

export interface TechnicianNumbers {
  // Right now
  active: number
  late: number
  // This month
  completed: number
  delivered: number
  revenue: number
}

export interface TechnicianMetrics extends TechnicianNumbers {
  technicianId: string
  name: string
}

// Each technician's orders: only the owner and admins can see it
export async function getTechnicianMetrics() {
  const response = await api.get<{
    metrics: { technicians: TechnicianMetrics[]; unassigned: TechnicianNumbers }
  }>('/metrics/technicians')

  return response.data.metrics
}
