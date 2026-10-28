# Roadmap do FastOS Web

O projeto parte do `pizza-shop`, um projeto de escola com React, shadcn e TanStack Query, e o adapta para o FastOS.

## Como usar este documento

- Cada etapa é feita numa branch curta, com squash merge na `main`.
- O PR de cada etapa atualiza este arquivo: o status, o link do PR e as decisões tomadas.
- O que depende da API fica em "Mudanças na API". Cada mudança vira um PR no `fastos-api`, feito antes da etapa que precisa dela.

## Etapas

| # | Entrega | Status |
|---|---|---|
| F0 | Base do projeto: Vite, Tailwind, shadcn, React Router, testes, lint, variáveis de ambiente, layouts e a loja descoberta pelo subdomínio | Feito (primeiro commit) |
| F1 | Cadastro da loja, login pelo subdomínio, renovação automática do token, sair e menu com o usuário e a loja | **Próximo** |
| F2 | Clientes e aparelhos: lista com busca, cadastro, edição e exclusão conforme o papel | Pendente |
| F3 | Ordens de serviço: lista com filtros, abertura, detalhes, status, itens, histórico, edição e técnico | Pendente |
| F4 | Equipe: listar e criar usuários | Pendente |
| F5 | Dashboard | Pendente |
| F6 | Testes de ponta a ponta (Playwright) e deploy | Pendente |

### F0: base do projeto

- **Loja pelo endereço:** `getTenantSlug` (`src/lib/tenant.ts`) lê a loja do subdomínio, e o domínio vem de `VITE_APP_HOST`. O próprio domínio e o `www` são o site público, e mais de um nível de subdomínio é ignorado.
- **Duas árvores de rotas** (`src/routes.tsx`):
  - o site público, no domínio, com o cadastro;
  - a loja, no subdomínio, com o login e o painel.
- **Tema claro, escuro ou do sistema,** salvo no navegador.
- **Páginas 404 e de erro.**
- **Cadastro, login e início só com o título.** Os formulários entram no F1.

## Mudanças na API

| # | Mudança | Precisa para | Status |
|---|---|---|---|
| A1 | Total de registros nas listas de clientes, aparelhos e OS | F2: paginação com "página X de Y" | Pendente |
| A2 | Lista de OS com o nome do cliente e a descrição do aparelho; hoje vêm só os IDs | F3: sem isso, a tabela faria uma chamada extra por linha | Pendente |
| A3 | Rota para listar os usuários da loja | F3: escolher o técnico; F4: tela da equipe | Pendente |
| A4 | Rotas de métricas | F5 | Pendente |

## Débitos conhecidos

- **O tema é guardado por subdomínio:** cada loja lembra o seu.
- **O tema pode piscar no primeiro carregamento:** a página abre no tema claro por um instante antes de aplicar o escuro.
- **O bundle tem 580 kB (183 kB comprimido),** acima do aviso do Vite. A saída é dividir o código por rota, quando houver telas.
- **A CLI do shadcn traz 3 falhas de gravidade baixa,** no `deepmerge`. Ela fica nas dependências de desenvolvimento, e nada dela chega ao navegador: `npm audit --omit=dev` não acusa nada.

## Decisões

| Data | Decisão | Motivo | Alternativas descartadas |
|---|---|---|---|
| 2026-10-27 | Base no `pizza-shop`, com as bibliotecas nas versões atuais | O código das telas quase não muda, nenhuma migração fica para depois, e o Vite 5 tinha falhas conhecidas | Copiar o `pizza-shop` com as versões dele |
| 2026-10-27 | TypeScript 7 e oxlint, como vêm no template do Vite | Sem o typescript-eslint, nada prende o projeto ao TypeScript 6 | ESLint com typescript-eslint, que exige o TypeScript 6 |
| 2026-10-27 | Loja pelo subdomínio, com o domínio em `VITE_APP_HOST` | Funciona local com `*.localhost`, e trocar de domínio no deploy não muda código | Domínio fixo no código |
| 2026-10-27 | Tudo local até o fluxo completo funcionar; domínio e hospedagem só no primeiro deploy | Ver funcionando antes de pagar por qualquer coisa | Deploy de prévia sem domínio |
| 2026-10-27 | Tema com o provider do `pizza-shop` | O `next-themes`, que o shadcn instala, injeta um `<script>` pensado para renderização no servidor, e o React 19 acusa erro num app que roda só no navegador | `next-themes` |
| 2026-10-27 | Título da página com o `<title>` do React 19 | O React já leva o título para o `<head>`, sem dependência | `react-helmet-async`, usado no `pizza-shop` |
| 2026-10-27 | MSW e Playwright só quando houver fluxo para testar | Na base não há chamada à API para simular | Instalar tudo já no F0 |
