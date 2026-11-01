import { z } from 'zod'

// zod compiles object schemas with new Function, which the site's Content
// Security Policy (public/_headers) does not allow; the plain parser is fast
// enough for forms. A schema reads this when it is created, so every file
// takes z from here instead of from 'zod' (the lint enforces it)
z.config({ jitless: true })

export { z }
