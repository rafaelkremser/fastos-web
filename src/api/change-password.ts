import { api } from '@/lib/axios'

export interface ChangePasswordBody {
  currentPassword: string
  newPassword: string
}

// The signed-in person's own password. A wrong current one is a 403
export async function changePassword(body: ChangePasswordBody) {
  await api.patch('/user/password', body)
}
