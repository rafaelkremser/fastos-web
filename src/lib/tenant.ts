import { env } from '@/env'

// Each store has its own subdomain: loja-a.<app host> is the store "loja-a",
// and the app host itself is the public site, where stores sign up
export function getTenantSlug(hostname: string, appHost: string) {
  const suffix = `.${appHost}`

  if (!hostname.endsWith(suffix)) {
    return null
  }

  const slug = hostname.slice(0, -suffix.length)

  // Only one level below the app host; www is the public site as well
  if (!slug || slug.includes('.') || slug === 'www') {
    return null
  }

  return slug
}

export function getCurrentTenantSlug() {
  return getTenantSlug(window.location.hostname, env.VITE_APP_HOST)
}
