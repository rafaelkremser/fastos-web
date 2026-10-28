// The access token lives only in memory and is gone when the page reloads.
// The refresh token stays in localStorage, which each store's subdomain keeps
// apart, so being signed in to one store says nothing about another
const REFRESH_TOKEN_KEY = 'fastos-refresh-token'

let accessToken: string | null = null

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string) {
  accessToken = token
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function hasSession() {
  return getRefreshToken() !== null
}

export function startSession(tokens: {
  accessToken: string
  refreshToken: string
}) {
  accessToken = tokens.accessToken
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  notify()
}

export function endSession() {
  accessToken = null
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  notify()
}

export function subscribeToSession(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

// Signing in or out in another tab of the same store applies here too. The
// access token in memory may belong to the old session, so it is dropped and
// the next request gets a new one
window.addEventListener('storage', (event) => {
  if (event.key === REFRESH_TOKEN_KEY || event.key === null) {
    accessToken = null
    notify()
  }
})
