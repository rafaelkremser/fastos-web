import { api } from '@/lib/axios'

import type { User } from './types'

export type { UserRole } from './types'

export async function getUser() {
  const response = await api.get<{ user: User }>('/user')

  return response.data.user
}
