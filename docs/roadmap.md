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
| F2 | Clientes e aparelhos: lista com busca, cadastro, edição e exclusão conforme o papel | Feito ([PR #3](https://github.com/rafaelkremser/fastos-web/pull/3)) |
| F3 | Ordens de serviço: lista com filtros, abertura, detalhes, status, itens, histórico, edição e técnico | Feito ([PR #4](https://github.com/rafaelkremser/fastos-web/pull/4)) |
| F3.1 | Aviso ao cliente: marca e filtro na lista, registrar aviso na OS, atalho de WhatsApp com mensagem pronta | Feito (junto do F3, no [PR #4](https://github.com/rafaelkremser/fastos-web/pull/4)) |
| F4 | Equipe: listar e criar usuários | **Próximo** |
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
- **Loja aguardando aprovação:** se a API devolve a loja inativa, o cadastro mostra "Cadastro recebido" em vez de levar ao login. No login, a loja pendente recebe um aviso próprio, porque a API só responde 403 quando a senha está certa. Se a API estiver com `TENANT_AUTO_APPROVAL=true`, o cadastro leva direto ao login, como antes.
- **Painel:** sem sessão, manda para o login. O menu da conta mostra a loja, o usuário e o papel, e tem o "Sair".
- **Testado contra a API real,** num branch temporário do Neon: cadastro, senha errada, login, recarga com uma única renovação, sair, token de renovação recusado, acesso pelo site público e endereço repetido. Com a aprovação: "Cadastro recebido", aviso de loja pendente no login, liberação pelo comando da API e login depois de liberada.

### F2: clientes e aparelhos

- **Lista de clientes** (`/customers`): busca pelo nome e página na URL, então dá para voltar e compartilhar o link; "página X de Y" com o total que o A1 trouxe; num celular, a tabela mostra só nome e telefone.
- **Cadastro e edição de cliente** num diálogo: só nome e telefone são obrigatórios, e o telefone precisa do DDD. Depois do cadastro, a tela vai para a página do cliente, onde se cadastra o aparelho.
- **Página do cliente** (`/customers/:id`): dados, endereço montado num texto só, e a lista de aparelhos com cadastro, edição e exclusão.
- **Exclusão** com confirmação, só para dono e administrador (o botão nem aparece para técnico e atendente). Cliente ou aparelho com OS não pode ser excluído, e a tela explica o motivo; excluir um cliente leva os aparelhos dele junto (A6).
- **Cabeçalho:** link "Clientes", que continua marcado nas páginas de dentro; num celular, os links mostram só o ícone.
- **Testado contra a API real,** num branch temporário do Neon, com 24 clientes: duas páginas, busca, cadastro com validação do DDD, aparelho com tipo, edição, exclusão de aparelho e de cliente, e os dois 409.

### F3: ordens de serviço

- **Lista** (`/service-orders`, onde o painel abre): número, cliente com telefone, aparelho, status com cor, técnico, entrada e previsão; filtros por número, status e técnico na URL; prioridade alta e urgente em destaque.
- **Nova OS** (`/service-orders/new`): busca o cliente pelo nome enquanto digita, escolhe o aparelho (ou cadastra um ali mesmo, que já vem escolhido), descreve o problema, prioridade, previsão e observação interna. Da página do cliente, ele já vem escolhido; da linha de um aparelho, o aparelho também.
- **Página da OS** (`/service-orders/:id`): resumo (cliente, aparelho, técnico, prazos, garantia, valores), problema, diagnóstico e solução, peças e serviços com total, e histórico com quem fez cada mudança.
- **Ações, conforme o papel:** mudar status (todos, com o próximo passo sugerido e uma observação que vai para o histórico), editar e lançar itens (dono, administrador e técnico), escolher o técnico (dono e administrador).
- **Página do cliente** ganhou as OS dele e o botão "Abrir OS".
- **Telas do painel carregam sob demanda;** a de login não baixa o código das OS.
- **Testado contra a API real,** com a loja demo: filtros, item com valor "35,50", mudança de status com observação, edição com valores e data, remoção de item, nova OS com aparelho cadastrado na hora, técnico, atalhos da página do cliente e a atendente vendo só "Mudar status".
- **Encontrados no teste e corrigidos:**
  - cadastrar um aparelho dentro da Nova OS também enviava o formulário da OS: o React leva o envio de um formulário dentro de um diálogo até os formulários em volta, mesmo pelo portal. Com o problema preenchido, a OS seria aberta sem querer. O diálogo saiu de dentro do formulário, e um teste cobre o caso;
  - o rodapé dos itens somava "itens − desconto", mas a API calcula o total sobre o valor final, ou o orçamento, quando existem. Agora o rodapé mostra qual valor vale.

### F3.1: aviso ao cliente

- **Quem precisa de aviso:** OS "Aguardando aprovação" ou "Pronta" que ainda não teve aviso registrado. Mudar o status apaga o aviso, então cada etapa pede o seu (A9).
- **Lista:** a marca "Avisar cliente" embaixo do status e o botão "Precisa avisar", que filtra na hora, sem passar pelo "Filtrar", e fica na URL como os outros filtros. "Limpar" desliga também.
- **Página da OS:**
  - um destaque diz o que falta ("Pronta: falta avisar o cliente para retirar" ou "Orçamento pronto: falta avisar o cliente para aprovar");
  - "Abrir WhatsApp" abre a conversa com o cliente e a mensagem já escrita, com o nome, a loja, o aparelho, o número da OS e o valor. A mensagem muda para pronta ou orçamento. O número ganha o 55 do Brasil, e o botão some se o telefone não servir;
  - o diálogo "Registrar aviso" pede o canal (WhatsApp, ligação, SMS, e-mail, pessoalmente) e uma observação opcional. Abrir o WhatsApp já deixa esse diálogo aberto, esperando a volta;
  - o resumo ganhou a linha "Aviso ao cliente" ("Ainda não avisado" ou "Avisado em ..."), e o histórico mostra o aviso com a observação embaixo;
  - "Registrar aviso" fica no cabeçalho, para todos os papéis, quando não há destaque: serve para anotar outros contatos, como um atraso.
- **Testado contra a API real,** com a loja demo e a atendente: três OS marcadas, o filtro deixando só elas, a mensagem montada com os dados da OS nº 7, aviso por ligação com observação, a OS saindo da lista e o histórico com o aviso. A OS nº 3 mostrou o texto e a mensagem de orçamento. Os dois temas foram conferidos.

## Mudanças na API

| # | Mudança | Precisa para | Status |
|---|---|---|---|
| A1 | Total de registros nas listas de clientes, aparelhos e OS | F2: paginação com "página X de Y" | Feito ([fastos-api #14](https://github.com/rafaelkremser/fastos-api/pull/14)) |
| A2 | Lista de OS com o nome do cliente e a descrição do aparelho; hoje vêm só os IDs. Validar também o filtro de status, que hoje dá 500 com um valor desconhecido | F3: sem isso, a tabela faria uma chamada extra por linha | Feito ([fastos-api #16](https://github.com/rafaelkremser/fastos-api/pull/16)) |
| A3 | Rota para listar os usuários da loja | F3: escolher o técnico; F4: tela da equipe | Feito ([fastos-api #18](https://github.com/rafaelkremser/fastos-api/pull/18)) |
| A4 | Rotas de métricas | F5 | Pendente |
| A5 | Código de erro nas respostas, para o front não depender do texto da mensagem | Opcional: hoje o cadastro separa "endereço em uso" de "e-mail em uso" pelo texto do 409 | Pendente |
| A6 | Excluir cliente ou aparelho com OS responde 409, e não 500; excluir cliente sem OS leva os aparelhos junto | F2: sem isso, excluir quase qualquer cliente dava erro | Feito ([fastos-api #15](https://github.com/rafaelkremser/fastos-api/pull/15)) |
| A7 | Rota pública que diz se uma loja existe (`GET /tenants/:slug`, com o nome da loja; 404 se não existe), com limite de tentativas | Login e "Acessar sua loja" avisarem "Loja não encontrada" e o login mostrar o nome da loja. Adiado: não é prioridade agora | Pendente |
| A8 | Editar a OS não aceitar `technicianId`: hoje o técnico (que pode editar) consegue se atribuir por ali, sem passar pela rota de atribuição, que é só de dono e administrador, e sem registro no histórico | Fechar a brecha de papéis; o front já não envia esse campo | Pendente |
| A9 | Aviso ao cliente: a OS guarda quando a loja avisou o cliente, mudar o status apaga, `POST /service-orders/:id/notices` registra (com canal e observação, no histórico) e a lista filtra `needsCustomerNotice` | F3.1: marca "Avisar cliente", filtro "Precisa avisar", botão de registrar aviso e atalho de WhatsApp | Feito ([fastos-api #19](https://github.com/rafaelkremser/fastos-api/pull/19)); front no F3.1 |

## Débitos conhecidos

- **O tema é guardado por subdomínio:** cada loja lembra o seu.
- **O tema pode piscar no primeiro carregamento:** a página abre no tema claro por um instante antes de aplicar o escuro.
- **O bundle principal tem 717 kB (229 kB comprimido),** acima do aviso do Vite. As telas do painel já carregam sob demanda; o que sobra (React, rotas, formulários, validação) a tela de login também usa.
- **O histórico da OS só registra status, técnico e avisos:** itens lançados ou removidos e edições de valor não aparecem nele, porque a API não grava.
- **O atalho do WhatsApp supõe telefone do Brasil:** um número com DDD ganha o 55 na frente. Telefone de outro país não ganha o botão, mas o aviso pode ser registrado do mesmo jeito.
- **Abrir o WhatsApp não prova que a mensagem saiu:** quem registra o aviso é a pessoa, no diálogo que fica aberto.
- **Editar um cliente não confere telefone repetido:** a API só verifica no cadastro, então a edição aceita o telefone de outro cliente.
- **Telefones salvos por outros meios** com pontuação, como "(11) 98765-4321", não batem com a verificação de repetido, que compara o texto. O front sempre envia só os números.
- **O cadastro separa os dois 409 pelo texto da mensagem da API** ("address"). Se a mensagem mudar, o erro de endereço passa a aparecer no campo de e-mail. O A5 resolve.
- **O front não sabe se a loja existe:** qualquer subdomínio abre um login, e um endereço digitado errado (no navegador ou no "Acessar sua loja") só descobre o erro ao tentar entrar, com "e-mail ou senha incorretos". O A7 resolve; adiado por decisão do dono do projeto.
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
| 2026-10-27 | O cadastro decide pela resposta da API: loja inativa mostra "Cadastro recebido", loja ativa vai para o login | Funciona com a API nos dois modos (`TENANT_AUTO_APPROVAL`), sem configuração no front | Variável própria no front |
| 2026-10-27 | Testes simulam a API com um adaptador falso do axios e `vi.mock` nas funções de `src/api` | Cobre a renovação e as telas sem dependência nova; o MSW fica para quando os testes de ponta a ponta (F6) precisarem | MSW já no F1 |
| 2026-10-28 | Telefone enviado só com números e mostrado formatado; com DDD obrigatório | A API compara o texto para achar telefone repetido; "(11) 98765-4321" e "11987654321" seriam dois clientes | Guardar como foi digitado; máscara no campo |
| 2026-10-28 | Cliente em página própria, com os aparelhos dentro; cadastro e edição em diálogos | O aparelho só existe para o cliente, e a página é o ponto de partida da OS no F3 | Tudo em diálogos sobre a lista |
| 2026-10-28 | Botões de excluir escondidos para quem não pode (técnico e atendente) | Evita oferecer o que a API vai recusar; a API continua conferindo | Mostrar e tratar o 403 |
| 2026-10-28 | Avisar "Loja não encontrada" fica para depois (A7) | Não é prioridade agora; o login já recusa e nada vaza | Fazer antes do F3 |
| 2026-10-28 | O painel abre na lista de OS até existir o dashboard (F5) | É a tela do dia a dia; um "Início" vazio não ajudava | Manter o "Início" vazio |
| 2026-10-28 | Qualquer status pode ser escolhido, com o próximo passo do fluxo sugerido | A API não tem regra de transição, e a loja às vezes pula etapas | Só botões de "próximo passo", como no `pizza-shop` |
| 2026-10-28 | Aviso ao cliente como registro à parte, e não como status novo | O status diz onde o aparelho está; o aviso diz se o cliente sabe. Status como "Pronta, cliente avisado" dobrariam o fluxo | Status "Pronta, avisar cliente" e "Pronta, cliente avisado" |
| 2026-10-29 | WhatsApp por link (`wa.me`) com a mensagem pronta, enviada pela própria pessoa | Não custa nada, não exige integração e usa o WhatsApp que a loja já tem | Envio automático pela API do WhatsApp Business, que é paga e exige aprovação da Meta |
| 2026-10-29 | Abrir o WhatsApp deixa o diálogo de registro aberto, mas não registra sozinho | Abrir a conversa não garante que a mensagem foi enviada | Registrar o aviso ao clicar no botão |
| 2026-10-28 | Técnico escolhido entre os usuários ativos que não são atendentes | Em loja pequena o dono também conserta; o atendente não | Só quem tem o papel de técnico |
| 2026-10-28 | O rodapé dos itens mostra o valor que vale no total (final, orçamento ou soma dos itens) | É a regra da API; sem isso, o total parece uma soma errada | Calcular o total no front |
| 2026-10-28 | Datas sem hora (previsão, garantia) mostradas em UTC | A API guarda o dia à meia-noite UTC; no fuso do Brasil ele apareceria como o dia anterior | Mandar a data com fuso |
| 2026-10-28 | Tipos de aparelho numa lista do front (Celular, Tablet, Notebook...), com o código salvo em inglês | A API aceita qualquer texto; a lista padroniza sem mudar a API, e um tipo desconhecido aparece como foi salvo | Tipo como enum na API |
