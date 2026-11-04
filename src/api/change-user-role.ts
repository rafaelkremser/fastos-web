import { api } from '@/lib/axios'

import type { User, UserRole } from './types'

export interface ChangeUserRoleParams {
  userId: string
  // Nobody becomes a second owner
  role: Exclude<UserRole, 'OWNER'>
}

// The new role reaches the person on their next token refresh, within 15
// minutes
export async function changeUserRole({ userId, role }: ChangeUserRoleParams) {
  const response = await api.patch<{ user: User }>(`/users/${userId}/role`, {
    role,
  })

  return response.data.user
}
