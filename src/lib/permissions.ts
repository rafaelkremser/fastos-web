import type { UserRole } from '@/api/get-user'

// Same as the API's role matrix: only the owner and admins delete customers
// and devices. The API checks it anyway; this only hides what would fail
export function canDeleteRecords(role: UserRole | undefined) {
  return role === 'OWNER' || role === 'ADMIN'
}
