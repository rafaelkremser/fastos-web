# FastOS Web

Frontend do FastOS, o sistema de ordens de serviço para assistências técnicas. Ele conversa com a [FastOS API](https://github.com/rafaelkremser/fastos-api).

## Uma loja por subdomínio

Cada loja tem o próprio endereço, e o front descobre qual é a loja pelo subdomínio:

| Endereço local | O que abre |
|---|---|
| `http://localhost:5173` | Site público, onde as lojas se cadastram |
| `http://loja-a.localhost:5173` | A loja `loja-a` |

Chrome e Edge mandam qualquer `*.localhost` para o próprio computador, então nada precisa ser configurado. Em produção, o domínio troca por variável de ambiente, sem mudar código.

## Rodando localmente

Requisitos:

- Node 22.22 ou mais novo.
- A API rodando em `http://localhost:3333`. O `CORS_ORIGINS` do `.env.example` dela já libera `http://*.localhost:5173`.

```bash
npm install
npm run dev
```

As variáveis de ambiente de desenvolvimento ficam no `.env.development`, que é versionado porque não guarda segredos. Para mudar um valor só na sua máquina, crie um `.env.development.local`, que o git ignora.

| Variável | Para quê |
|---|---|
| `VITE_API_URL` | Endereço da API |
| `VITE_APP_HOST` | Domínio de onde saem os subdomínios das lojas, sem a porta |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento em `localhost:5173` |
| `npm run build` | Confere os tipos e gera o site em `dist/` |
| `npm run lint` | Roda o oxlint |
| `npm run format` | Formata o projeto com o Prettier |
| `npm test` | Roda os testes em modo de observação; `npx vitest run` roda uma vez só |
| `npm run test:e2e` | Roda os testes de ponta a ponta contra a API de verdade (veja abaixo) |

## Testes de ponta a ponta

Os testes em `e2e/` usam o Playwright e passam pelas telas como uma pessoa faria, contra a API e um banco reais. O `npm run test:e2e`:

1. compila a API da pasta ao lado (`../fastos-api`; `FASTOS_API_DIR` muda o caminho);
2. cria um branch temporário do Neon a partir do `dev` e aplica nele as migrations da API;
3. sobe a API na porta 3335 e o front na 5175, então o `npm run dev` pode continuar ligado;
4. roda os testes, cada rodada com lojas novas, e apaga o branch no fim. Se o script parar no meio, o branch expira sozinho em duas horas.

Requisitos, além dos da API:

- O CLI do Neon com login feito (`neon auth`). O projeto vem do `.neon` da API (`neon set-context`) ou de `NEON_PROJECT_ID`.
- O navegador do Playwright, instalado uma vez com `npx playwright install chromium`.

O que vem depois do `--` vai para o Playwright: `npm run test:e2e -- --headed` mostra o navegador, e `npm run test:e2e -- e2e/sign-up.spec.ts` roda um arquivo só. Quando um teste falha, o relatório fica em `playwright-report/` (`npx playwright show-report`), com o passo a passo de cada falha.

## Stack

- **Base:** React 19, Vite 8 e TypeScript 7.
- **Visual:** Tailwind 4 e shadcn/ui, sobre Radix.
- **Rotas e dados:** React Router 8 no modo data, TanStack Query e axios.
- **Formulários e avisos:** react-hook-form com zod, e sonner para os avisos.
- **Qualidade:** Vitest com Testing Library (happy-dom), Playwright, oxlint e Prettier.

O plano das etapas e as decisões tomadas estão em [`docs/roadmap.md`](docs/roadmap.md).
