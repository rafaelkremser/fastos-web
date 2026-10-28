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

export async function registerTenant(body: RegisterTenantBody) {
  await api.post('/accounts', body)
}
