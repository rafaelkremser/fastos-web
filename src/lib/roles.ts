import type { CreateUserBody } from '@/api/create-user'
import type { UserRole } from '@/api/types'

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Dono',
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  RECEPTIONIST: 'Atendente',
}

// Who each role can add to the team, as in the API. Nobody creates an owner
const ASSIGNABLE_ROLES: Record<UserRole, CreateUserBody['role'][]> = {
  OWNER: ['ADMIN', 'TECHNICIAN', 'RECEPTIONIST'],
  ADMIN: ['TECHNICIAN', 'RECEPTIONIST'],
  TECHNICIAN: [],
  RECEPTIONIST: [],
}

export function getAssignableRoles(role: UserRole | undefined) {
  return role ? ASSIGNABLE_ROLES[role] : []
}
