import { api } from '@/lib/axios'

import type { User, UserRole } from './types'

// The whole team of the store, sorted by name
export async function fetchUsers(params: { role?: UserRole } = {}) {
  const response = await api.get<{ users: User[] }>('/users', { params })

  return response.data.users
}
