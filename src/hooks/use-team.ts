import { useQuery } from '@tanstack/react-query'

import { fetchUsers } from '@/api/fetch-users'

// The store's users, for showing names and choosing a technician. A team
// changes rarely, so it is fetched once per visit
export function useTeam() {
  const query = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(),
    staleTime: Infinity,
  })

  const users = query.data ?? []

  return {
    ...query,
    users,
    // Who can take an order: anyone active except the receptionists
    technicians: users.filter(
      (user) => user.isActive && user.role !== 'RECEPTIONIST',
    ),
    getName: (userId: string | null) =>
      users.find((user) => user.id === userId)?.name ?? null,
  }
}
