import { api } from '@/lib/axios'

export type UserRole = 'OWNER' | 'ADMIN' | 'TECHNICIAN' | 'RECEPTIONIST'

export interface GetUserResponse {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    isActive: boolean
    createdAt: string
  }
}

export async function getUser() {
  const response = await api.get<GetUserResponse>('/user')

  return response.data.user
}
