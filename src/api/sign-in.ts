import { api } from '@/lib/axios'

export interface SignInBody {
  tenantSlug: string
  email: string
  password: string
}

interface SignInResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

export async function signIn(body: SignInBody) {
  const response = await api.post<SignInResponse>('/authenticate', body)

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
  }
}
