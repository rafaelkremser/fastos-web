// Runs the end-to-end tests against the real API, on a database of their own:
//
//   1. builds the API in ../fastos-api (FASTOS_API_DIR changes it)
//   2. creates a temporary Neon branch from dev (E2E_NEON_PARENT changes it).
//      It expires in two hours, in case this script stops before deleting it
//   3. applies the API's migrations to the branch
//   4. runs Playwright, which starts the API and the frontend on ports of
//      their own (3335 and 5175), so npm run dev can stay on
//   5. deletes the branch
//
// Needs the Neon CLI signed in. The project comes from the API's .neon file
// (neon set-context) or from NEON_PROJECT_ID. Arguments go to Playwright:
//
//   npm run test:e2e -- --headed

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const webDir = path.resolve(import.meta.dirname, '..')
const apiDir =
  process.env.FASTOS_API_DIR ?? path.resolve(webDir, '../fastos-api')
const parent = process.env.E2E_NEON_PARENT ?? 'dev'
const branch = `e2e-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`
const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

const contextFile = path.join(apiDir, '.neon')
const project = process.env.NEON_PROJECT_ID
  ? `--project-id ${process.env.NEON_PROJECT_ID}`
  : existsSync(contextFile)
    ? `--context-file "${contextFile}"`
    : ''

// npm, npx and neon are .cmd files on Windows, which only run in a shell. No
// command carries a secret: the database URLs go in the environment
function run(command, options = {}) {
  const result = spawnSync(command, {
    shell: true,
    stdio: 'inherit',
    encoding: 'utf8',
    ...options,
  })

  if (result.status !== 0) {
    throw new Error(`Falhou: ${command.split(' --')[0]}`)
  }

  return result
}

// Neon prints the passwords when it creates a branch, so its output is dropped
function neon(command, stdout = 'ignore') {
  return run(`neon ${command} ${project}`, {
    stdio: ['ignore', stdout, 'inherit'],
  })
}

function connectionString(pooled) {
  const { stdout } = neon(
    `connection-string ${branch}${pooled ? ' --pooled' : ''}`,
    'pipe',
  )

  // As in the API's .env.example: verify-full checks the server, like
  // require does today, without the warning
  return stdout.trim().replace('sslmode=require', 'sslmode=verify-full')
}

// Ctrl+C reaches Playwright too; this script waits for it and cleans up
process.on('SIGINT', () => {})

let status = 1

console.log('Compilando a API...')
run('npm run build', { cwd: apiDir })

console.log(`Criando o banco temporário ${branch} a partir do ${parent}...`)
neon(
  `branches create --name ${branch} --parent ${parent} --expires-at ${expiresAt}`,
)

try {
  const env = {
    ...process.env,
    E2E_DATABASE_URL: connectionString(true),
    E2E_DATABASE_URL_UNPOOLED: connectionString(false),
    FASTOS_API_DIR: apiDir,
  }

  console.log('Aplicando as migrations da API...')
  run('npx prisma migrate deploy', {
    cwd: apiDir,
    env: { ...env, DATABASE_URL_UNPOOLED: env.E2E_DATABASE_URL_UNPOOLED },
  })

  const playwright = spawnSync(
    process.execPath,
    [
      path.join(webDir, 'node_modules/@playwright/test/cli.js'),
      'test',
      ...process.argv.slice(2),
    ],
    { cwd: webDir, stdio: 'inherit', env },
  )
  status = playwright.status ?? 1
} finally {
  console.log(`Apagando o banco temporário ${branch}...`)

  try {
    neon(`branches delete ${branch}`)
  } catch {
    console.error(
      `Não deu para apagar o ${branch}; ele expira sozinho em duas horas.`,
    )
  }
}

process.exit(status)
