import { api } from '@/lib/axios'

export interface RegisterTenantBody {
  tenantName: string
  tenantSlug: string
  tenantEmail: string
  tenantPhone: string | null
  ownerName: string
  ownerEmail: string
  ownerPassword: string
}

interface RegisterTenantResponse {
  tenant: {
    name: string
    slug: string
    // False while the store waits for approval
    isActive: boolean
  }
}

export async function registerTenant(body: RegisterTenantBody) {
  const response = await api.post<RegisterTenantResponse>('/accounts', body)

  return response.data.tenant
}
