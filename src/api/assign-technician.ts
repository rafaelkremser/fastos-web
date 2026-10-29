import { api } from '@/lib/axios'

import type { ServiceOrder } from './types'

export interface AssignTechnicianParams {
  serviceOrderId: string
  technicianId: string
}

export async function assignTechnician({
  serviceOrderId,
  technicianId,
}: AssignTechnicianParams) {
  const response = await api.patch<{ serviceOrder: ServiceOrder }>(
    `/service-orders/${serviceOrderId}/technician`,
    { technicianId },
  )

  return response.data.serviceOrder
}
