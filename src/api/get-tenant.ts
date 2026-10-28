import { api } from '@/lib/axios'

export interface GetTenantResponse {
  tenant: {
    id: string
    name: string
    slug: string
    email: string
    document: string | null
    phone: string | null
    isActive: boolean
    createdAt: string
  }
}

export async function getTenant() {
  const response = await api.get<GetTenantResponse>('/tenant')

  return response.data.tenant
}
