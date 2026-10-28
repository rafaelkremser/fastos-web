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
| F1 | Cadastro da loja, login pelo subdomínio, renovação automática do token, sair e menu com o usuário e a loja | Feito ([PR #1](https://github.com/rafaelkremser/fastos-web/pull/1)) |
| F2 | Clientes e aparelhos: lista com busca, cadastro, edição e exclusão conforme o papel | **Próximo** (antes, o A1 na API) |
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

### F1: cadastro, login e sessão

- **Site público** (`localhost:5173`):
  - **cadastro da loja:** sugere o endereço a partir do nome, até a pessoa editar, mostra onde a loja vai abrir e confere as regras do endereço antes de enviar. As regras são as mesmas da API, copiadas em `src/lib/slug.ts`. Depois do cadastro, leva ao login da loja nova;
  - **acesso à loja:** pede o endereço e leva ao subdomínio dela.
- **Login da loja** (`loja.localhost:5173/sign-in`): envia o slug do endereço junto com o e-mail e a senha. Avisa quando o e-mail ou a senha estão errados e quando o limite de tentativas estoura.
- **Sessão** (`src/lib/session.ts` e `src/lib/axios.ts`):
  - o token de acesso fica só na memória;
  - o de renovação fica no `localStorage`, separado por subdomínio;
  - depois de uma recarga, o primeiro pedido renova o token antes de sair;
  - um 401 renova o token e repete o pedido uma vez só;
  - pedidos que falham juntos dividem uma única renovação;
  - se a API recusa a renovação, a sessão termina e o painel volta ao login. Se a falha for outra, como a API fora do ar, a sessão continua;
  - sair numa aba sai nas outras abas da mesma loja.
- **Painel:** sem sessão, manda para o login. O menu da conta mostra a loja, o usuário e o papel, e tem o "Sair".
- **Testado contra a API real,** num branch temporário do Neon: cadastro, senha errada, login, recarga com uma única renovação, sair, token de renovação recusado, acesso pelo site público e endereço repetido.

## Mudanças na API

| # | Mudança | Precisa para | Status |
|---|---|---|---|
| A1 | Total de registros nas listas de clientes, aparelhos e OS | F2: paginação com "página X de Y" | Pendente |
| A2 | Lista de OS com o nome do cliente e a descrição do aparelho; hoje vêm só os IDs | F3: sem isso, a tabela faria uma chamada extra por linha | Pendente |
| A3 | Rota para listar os usuários da loja | F3: escolher o técnico; F4: tela da equipe | Pendente |
| A4 | Rotas de métricas | F5 | Pendente |
| A5 | Código de erro nas respostas, para o front não depender do texto da mensagem | Opcional: hoje o cadastro separa "endereço em uso" de "e-mail em uso" pelo texto do 409 | Pendente |

## Débitos conhecidos

- **O tema é guardado por subdomínio:** cada loja lembra o seu.
- **O tema pode piscar no primeiro carregamento:** a página abre no tema claro por um instante antes de aplicar o escuro.
- **O bundle tem 580 kB (183 kB comprimido),** acima do aviso do Vite. A saída é dividir o código por rota, quando houver telas.
- **O cadastro separa os dois 409 pelo texto da mensagem da API** ("address"). Se a mensagem mudar, o erro de endereço passa a aparecer no campo de e-mail. O A5 resolve.
- **O acesso pelo site público não sabe se a loja existe:** um endereço digitado errado abre o login de uma loja que não existe, e a resposta é "e-mail ou senha incorretos". A API não tem rota pública que diga se uma loja existe.
- **Os tokens ficam no `localStorage`,** então um script injetado no site (XSS) conseguiria lê-los. É o mesmo débito do roadmap da API; a alternativa é o token de renovação num cookie que o JavaScript não lê.
- **Sair só apaga os tokens deste navegador:** a API não revoga, então uma cópia do token de renovação vale até completar 7 dias do login (débito da API, P3-1).
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
| 2026-10-27 | Token de acesso na memória e o de renovação no `localStorage` | Segue a decisão da API de devolver os tokens no corpo. O `localStorage` de cada subdomínio é separado, então cada loja tem a sua sessão | Os dois no `localStorage`; cookie, que exigiria mudar a API |
| 2026-10-27 | Renovar antes do primeiro pedido depois de uma recarga, e não esperar o 401 | Economiza um pedido que falharia em toda recarga | Renovar só no 401 |
| 2026-10-27 | Sem sessão, o pedido a uma rota protegida nem sai | Toda rota protegida exige token; sem ele, a API só responderia 401 | Enviar e esperar o 401 |
| 2026-10-27 | Depois do cadastro, o login da loja nova pede o e-mail de novo | Passar o e-mail pela URL o deixaria no histórico e nos logs do servidor de arquivos | E-mail na URL, como no `pizza-shop` |
| 2026-10-27 | Login do site público pede o endereço da loja e leva ao subdomínio | O login de verdade precisa do subdomínio, e a API não diz quais lojas existem | Lista de lojas; descobrir a loja pelo e-mail |
| 2026-10-27 | Testes simulam a API com um adaptador falso do axios e `vi.mock` nas funções de `src/api` | Cobre a renovação e as telas sem dependência nova; o MSW fica para quando os testes de ponta a ponta (F6) precisarem | MSW já no F1 |
