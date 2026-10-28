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

## Stack

- **Base:** React 19, Vite 8 e TypeScript 7.
- **Visual:** Tailwind 4 e shadcn/ui, sobre Radix.
- **Rotas e dados:** React Router 8 no modo data, TanStack Query e axios.
- **Formulários e avisos:** react-hook-form com zod, e sonner para os avisos.
- **Qualidade:** Vitest com Testing Library (happy-dom), oxlint e Prettier.

O plano das etapas e as decisões tomadas estão em [`docs/roadmap.md`](docs/roadmap.md).
