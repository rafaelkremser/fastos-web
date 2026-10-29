import type { UserRole } from '@/api/types'

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Dono',
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  RECEPTIONIST: 'Atendente',
}
