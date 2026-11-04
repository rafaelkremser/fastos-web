import type { CreateUserBody } from '@/api/create-user'
import type { User, UserRole } from '@/api/types'

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Dono',
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  RECEPTIONIST: 'Atendente',
}

// Who each role can add to the team or move to another role, as in the API.
// Nobody creates an owner
const ASSIGNABLE_ROLES: Record<UserRole, CreateUserBody['role'][]> = {
  OWNER: ['ADMIN', 'TECHNICIAN', 'RECEPTIONIST'],
  ADMIN: ['TECHNICIAN', 'RECEPTIONIST'],
  TECHNICIAN: [],
  RECEPTIONIST: [],
}

export function getAssignableRoles(role: UserRole | undefined) {
  return role ? ASSIGNABLE_ROLES[role] : []
}

// Changing someone's role or access: only whoever could have given them their
// role, so the owner is out of anyone's reach, and never oneself (as in the API)
export function canManageUser(
  manager: Pick<User, 'id' | 'role'> | undefined,
  user: Pick<User, 'id' | 'role'>,
) {
  return (
    !!manager &&
    manager.id !== user.id &&
    getAssignableRoles(manager.role).some((role) => role === user.role)
  )
}
