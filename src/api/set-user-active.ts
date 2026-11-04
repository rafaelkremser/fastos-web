import { api } from '@/lib/axios'

import type { User } from './types'

export interface SetUserActiveParams {
  userId: string
  isActive: boolean
}

// Someone deactivated can no longer sign in, and is out within 15 minutes,
// when their access token expires. Their orders and history stay
export async function setUserActive({ userId, isActive }: SetUserActiveParams) {
  const response = await api.patch<{ user: User }>(`/users/${userId}/active`, {
    isActive,
  })

  return response.data.user
}
