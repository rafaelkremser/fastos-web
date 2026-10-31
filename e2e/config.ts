// Ports of their own, so the tests run beside npm run dev (3333 and 5173)
export const API_PORT = 3335
export const WEB_PORT = 5175

export const API_URL = `http://localhost:${API_PORT}`
export const PUBLIC_SITE_URL = `http://localhost:${WEB_PORT}`

// The browser sends any *.localhost to this computer, so each store opens on
// its own subdomain as it would in production
export function storeOrigin(slug: string) {
  return `http://${slug}.localhost:${WEB_PORT}`
}

export function storeUrl(slug: string, path = '/') {
  return `${storeOrigin(slug)}${path}`
}

// The tests share a store, so whatever they create carries one of these
export function uniqueId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

// A store takes each customer's phone only once
export function uniquePhone() {
  return `119${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`
}
