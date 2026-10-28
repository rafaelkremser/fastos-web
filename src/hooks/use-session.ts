import { useSyncExternalStore } from 'react'

import { hasSession, subscribeToSession } from '@/lib/session'

// Whether someone is signed in to this store; updates when the session ends
export function useSession() {
  return useSyncExternalStore(subscribeToSession, hasSession)
}
