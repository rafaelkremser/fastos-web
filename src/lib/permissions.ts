import type { UserRole } from '@/api/get-user'

// Same as the API's role matrix. The API checks it anyway; this only hides
// what it would refuse

// Deleting customers and devices
export function canDeleteRecords(role: UserRole | undefined) {
  return role === 'OWNER' || role === 'ADMIN'
}

// Editing a service order, its values and its items
export function canEditServiceOrders(role: UserRole | undefined) {
  return role === 'OWNER' || role === 'ADMIN' || role === 'TECHNICIAN'
}

export function canAssignTechnician(role: UserRole | undefined) {
  return role === 'OWNER' || role === 'ADMIN'
}

// Adding people to the team; which roles each can give is in getAssignableRoles
export function canCreateUsers(role: UserRole | undefined) {
  return role === 'OWNER' || role === 'ADMIN'
}

// The store's revenue, on the dashboard
export function canSeeRevenue(role: UserRole | undefined) {
  return role === 'OWNER' || role === 'ADMIN'
}
