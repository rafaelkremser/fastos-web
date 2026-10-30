import { api } from '@/lib/axios'

import type { User, UserRole } from './types'

export interface CreateUserBody {
  name: string
  email: string
  // The person signs in with it; the API keeps only its hash
  password: string
  // Nobody creates a second owner
  role: Exclude<UserRole, 'OWNER'>
}

export async function createUser(body: CreateUserBody) {
  const response = await api.post<{ user: User }>('/users', body)

  return response.data.user
}
