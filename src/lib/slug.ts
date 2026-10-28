// Same rules as the API's Slug value object, so the sign-up form can answer
// right away. The API still has the last word

const MIN_LENGTH = 3
const MAX_LENGTH = 63

// Subdomains the platform keeps for itself
const RESERVED = new Set([
  'www',
  'api',
  'app',
  'admin',
  'auth',
  'login',
  'mail',
  'smtp',
  'static',
  'assets',
  'cdn',
  'docs',
  'status',
  'help',
  'support',
  'billing',
  'dashboard',
  'dev',
  'staging',
])

export function hasValidSlugFormat(slug: string) {
  return (
    slug.length >= MIN_LENGTH &&
    slug.length <= MAX_LENGTH &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  )
}

export function isReservedSlug(slug: string) {
  return RESERVED.has(slug)
}

/**
 * "Assistência Técnica São João" -> "assistencia-tecnica-sao-joao"
 */
export function slugify(text: string) {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, '')
}
