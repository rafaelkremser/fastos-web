import { useQuery } from '@tanstack/react-query'

import { getUser } from '@/api/get-user'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: getUser,
    staleTime: Infinity,
  })
}
