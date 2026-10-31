import path from 'node:path'

import { defineConfig, devices } from '@playwright/test'

import { API_PORT, API_URL, PUBLIC_SITE_URL, WEB_PORT } from './e2e/config.ts'

// npm run test:e2e creates a temporary database and passes it here
const { E2E_DATABASE_URL, E2E_DATABASE_URL_UNPOOLED } = process.env

if (!E2E_DATABASE_URL || !E2E_DATABASE_URL_UNPOOLED) {
  throw new Error(
    'Rode os testes de ponta a ponta com npm run test:e2e, que cria o banco temporário da API.',
  )
}

// The API is the one in the folder beside this one, as it is checked out
const apiDir =
  process.env.FASTOS_API_DIR ??
  path.resolve(import.meta.dirname, '../fastos-api')

export default defineConfig({
  testDir: './e2e',
  // One at a time: the API takes 10 logins and 10 sign-ups from one IP per
  // minute and per hour, and the tests share a store
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: PUBLIC_SITE_URL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node dist/main',
      cwd: apiDir,
      port: API_PORT,
      env: {
        PORT: String(API_PORT),
        DATABASE_URL: E2E_DATABASE_URL,
        DATABASE_URL_UNPOOLED: E2E_DATABASE_URL_UNPOOLED,
        CORS_ORIGINS: `${PUBLIC_SITE_URL},http://*.localhost:${WEB_PORT}`,
        // New stores open right away, without the approval command
        TENANT_AUTO_APPROVAL: 'true',
      },
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: PUBLIC_SITE_URL,
      env: { VITE_API_URL: API_URL },
    },
  ],
})
