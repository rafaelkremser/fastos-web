import { z } from 'zod'

const envSchema = z.object({
  MODE: z.enum(['development', 'production', 'test']),
  VITE_API_URL: z.url(),
  VITE_APP_HOST: z.string().min(1),
})

export const env = envSchema.parse(import.meta.env)
