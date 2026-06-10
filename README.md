# 📚 Microserviço – Catálogo de Livros
## Sistema de Gestão de Biblioteca

Este microserviço é responsável pelo **catálogo da biblioteca**, gerenciando o ciclo de vida completo de:

- 📖 **Livros** — cadastro, consulta e controle de status
- ✍️ **Autores** — cadastro e vinculação a livros (N:N)
- 🏷️ **Gêneros** — categorização de livros (N:N)
- 📦 **Exemplares** — controle do estoque físico com rastreamento de disponibilidade

Faz parte do **Sistema de Gestão de Biblioteca**, composto por múltiplos microserviços:

| # | Microserviço | Status |
|---|---|---|
| 1 | Catálogo de Livros | ✅ Este projeto |
| 2 | Empréstimos e Devoluções | — |
| 3 | Usuários | — |
| 4 | Reservas de Livros | — |
| 5 | Relatórios e Estatísticas | — |

---

## 🛠 Stack Tecnológica

| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 22 | Runtime |
| Fastify | ^5.8.5 | Framework HTTP |
| Prisma ORM | ^5.22.0 | Acesso ao banco de dados |
| MySQL | — | Banco de dados relacional |
| amqplib | ^2.0.1 | Client RabbitMQ (AMQP) |
| jsonwebtoken | ^9.0.3 | Validação JWT |
| @infisical/sdk | ^5.0.2 | Gerenciamento de secrets |
| dotenv | ^17.4.2 | Variáveis de ambiente locais |
| Docker + Docker Compose | — | Containerização e deploy |
| Jenkins | — | CI/CD |
| nodemon | ^3.1.14 | Hot-reload em desenvolvimento |

---

## 🏗 Arquitetura

### Fluxo de uma requisição HTTP

```
Cliente HTTP
    ↓
Fastify (porta 9502)
    ↓
Middleware JWT (verificarToken / exigirFuncionario)  ← opcional por rota
    ↓
Route Handler
    ↓
Controller  (trata request/response, validações básicas)
    ↓
Service     (regras de negócio, orquestração)
    ↓
Prisma Client  (queries ao MySQL)
    ↓
MySQL (banco db_catalogo_biblioteca)
    ↑
    ↓ (events)
RabbitMQ Exchange "biblioteca" (topic)
    → Outros microserviços consomem os eventos
```

### Fluxo de inicialização do servidor

```
server.js
  1. carregarSenhasSeguras()   ← busca DATABASE_URL e RABBITMQ_URL no Infisical
  2. Registra plugins Prisma
  3. Configura CORS
  4. Registra rotas (/livros, /exemplares, /autores, /generos)
  5. rabbitmq.connect()        ← conecta ao broker, cria exchange
  6. rabbitmq.iniciarConsumidores()  ← escuta eventos de outros microsserviços
  7. fastify.listen(9502)
```

---

## 📁 Estrutura do Projeto

```
microservice-catalogo/
│
├── prisma/
│   └── schema.prisma          # Modelos com @map/@@map (sem alterar DB)
│
├── src/
│   ├── config/
│   │   ├── infisical.js       # Carrega secrets do Infisical na inicialização
│   │   ├── prisma.js          # Singleton do PrismaClient
│   │   └── rabbitmq.js        # Conexão, publish, consumers e EVENTS
│   │
│   ├── controllers/
│   │   ├── livroController.js
│   │   ├── autorController.js
│   │   ├── generoController.js
│   │   └── exemplarController.js
│   │
│   ├── middlewares/
│   │   └── auth.js            # verificarToken + exigirFuncionario (JWT)
│   │
│   ├── plugins/
│   │   └── prisma.js          # Plugin Fastify que injeta prisma no contexto
│   │
│   ├── routes/
│   │   ├── livro.js
│   │   ├── autor.js
│   │   ├── genero.js
│   │   └── exemplar.js
│   │
│   ├── services/
│   │   ├── livroService.js
│   │   ├── autorService.js
│   │   ├── generoService.js
│   │   └── exemplarService.js
│   │
│   └── server.js              # Ponto de entrada
│
├── Dockerfile                 # Build multi-stage (node:22-slim)
├── docker-compose.yml         # Serviço catalogo na porta 9502
├── Jenkinsfile                # Pipeline CI/CD (Windows)
├── Jenkinsfilelinux           # Pipeline CI/CD (Linux)
├── package.json
└── .env                       # Variáveis locais (não vai pro Git)
```

---

## 🗂 Modelagem do Banco de Dados

> O Prisma utiliza `@map` / `@@map` para mapear os nomes em camelCase do schema para os nomes prefixados reais das colunas no MySQL (ex: `titulo` → `livro_titulo`). **Não é necessário `prisma db push`** — apenas `npx prisma generate`.

### Entidades

#### 📖 Livro (`@@map("livro")`)
| Campo Prisma | Coluna MySQL | Tipo | Obs |
|---|---|---|---|
| id | livro_id | Int PK | autoincrement |
| titulo | livro_titulo | VarChar(255) | obrigatório |
| isbn | livro_isbn | VarChar(13) | único |
| editora | livro_editora | VarChar(100) | opcional |
| anoPublicacao | livro_ano_publicacao | Int | opcional |
| sinopse | livro_sinopse | VarChar(100) | opcional |
| numeroPaginas | livro_numero_paginas | Int | opcional |
| idioma | livro_idioma | VarChar(50) | opcional |
| status | livro_status | Int | 1=ativo / 0=inativo |

#### ✍️ Autor (`@@map("autor")`)
| Campo Prisma | Coluna MySQL | Tipo | Obs |
|---|---|---|---|
| id | autor_id | Int PK | autoincrement |
| nome | autor_nome | VarChar(200) | obrigatório |
| dataNascimento | autor_data_nascimento | Date | opcional |
| nacionalidade | autor_nacionalidade | VarChar(100) | opcional |
| biografia | autor_biografia | VarChar(100) | opcional |
| status | autor_status | Int | 1=ativo / 0=inativo |

#### 🏷️ Gênero (`@@map("genero")`)
| Campo Prisma | Coluna MySQL | Tipo | Obs |
|---|---|---|---|
| id | genero_id | Int PK | autoincrement |
| nome | genero_nome | VarChar(100) | único |
| descricao | genero_descricao | VarChar(100) | opcional |
| status | genero_status | Int | 1=ativo / 0=inativo |

#### 📦 Exemplar (`@@map("exemplar")`)
| Campo Prisma | Coluna MySQL | Tipo | Obs |
|---|---|---|---|
| id | exemplar_id | Int PK | autoincrement |
| codigoBarras | exemplar_codigo_barras | VarChar(50) | único |
| condicao | exemplar_condicao | Enum | Novo / Bom / Regular / Desgastado |
| disponibilidade | exemplar_status | Enum | Disponivel / Emprestado / Manutencao / Perdido |
| dataAquisicao | exemplar_data_aquisicao | Date | opcional |
| livroId | livro_id | Int FK | → livro.livro_id |

### Tabelas de Relacionamento

#### LivroAutor (`@@map("livro_autor")`) — N:N
| Campo Prisma | Coluna MySQL |
|---|---|
| id | livro_autor_id |
| livroId | livro_id |
| autorId | autor_id |
| status | livro_autor_status |

#### LivroGenero (`@@map("livro_genero")`) — N:N
| Campo Prisma | Coluna MySQL |
|---|---|
| id | livro_genero_id |
| livroId | livro_id |
| generoId | genero_id |

### Diagrama de Relacionamentos

```
Autor ────┐
          N:N (livro_autor)
          ├──────────── Livro ──── 1:N ──── Exemplar
          N:N (livro_genero)
Genero ───┘
```

---

## 🌐 Endpoints

**Base URL:** `http://localhost:9502`

> As rotas de escrita (POST/PATCH) possuem suporte a middleware JWT (`verificarToken` + `exigirFuncionario`) já preparado nos arquivos de rota, mas **atualmente comentado** — aguardando integração com o microserviço de Usuários.

### 📖 Livros — `/livros`

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/livros` | Lista todos os livros (aceita `?status=1`) | ❌ |
| GET | `/livros/:id` | Busca livro por ID (inclui exemplares, autores e gêneros) | ❌ |
| POST | `/livros` | Cadastra novo livro com autores e gêneros | ❌ (🔒 preparado) |
| PATCH | `/livros/:id/status` | Altera status do livro (ativo/inativo) | ❌ (🔒 preparado) |

**POST `/livros` — Body:**
```json
{
  "titulo": "Clean Code",
  "isbn": "9780132350884",
  "editora": "Prentice Hall",
  "anoPublicacao": 2008,
  "sinopse": "Boas práticas de programação",
  "numeroPaginas": 464,
  "idioma": "Inglês",
  "autores": [1, 2],
  "generos": [3]
}
```

---

### ✍️ Autores — `/autores`

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/autores` | Lista todos os autores | ❌ |
| GET | `/autores/:id` | Busca autor por ID | ❌ |
| POST | `/autores` | Cadastra novo autor | ❌ (🔒 preparado) |
| PATCH | `/autores/:id/status` | Altera status do autor | ❌ (🔒 preparado) |

---

### 🏷️ Gêneros — `/generos`

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/generos` | Lista todos os gêneros | ❌ |
| GET | `/generos/:id` | Busca gênero por ID | ❌ |
| POST | `/generos` | Cadastra novo gênero | ❌ (🔒 preparado) |
| PATCH | `/generos/:id/status` | Altera status do gênero | ❌ (🔒 preparado) |

---

### 📦 Exemplares — `/exemplares`

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/exemplares` | Lista todos os exemplares (aceita `?disponibilidade=Disponivel`) | ❌ |
| GET | `/exemplares/:id` | Busca exemplar por ID (inclui livro vinculado) | ❌ |
| POST | `/exemplares/livro/:livroId` | Adiciona exemplar físico a um livro | ❌ (🔒 preparado) |
| PATCH | `/exemplares/:id/status` | Atualiza condição e/ou disponibilidade do exemplar | ❌ (🔒 preparado) |

**POST `/exemplares/livro/:livroId` — Body:**
```json
{
  "codigoBarras": "9780132350884-001",
  "condicao": "Novo",
  "statusDisponibilidade": "Disponivel",
  "dataAquisicao": "2024-01-15"
}
```
> `condicao`: `Novo` | `Bom` | `Regular` | `Desgastado`
> `statusDisponibilidade`: `Disponivel` | `Emprestado` | `Manutencao` | `Perdido`

---

### ❤️ Health Check

| Método | Rota | Resposta |
|---|---|---|
| GET | `/health` | `{ "status": "ok", "servico": "catalogo" }` |

---

## 🔁 Integração via RabbitMQ

O serviço usa um **exchange do tipo `topic`** chamado `biblioteca`. Toda comunicação entre microsserviços é feita via eventos assíncronos.

### Eventos Publicados (Producer)

| Routing Key | Quando é emitido |
|---|---|
| `biblioteca.catalogo.livro_criado` | Novo livro cadastrado |
| `biblioteca.catalogo.livro_alterado` | Status do livro alterado |
| `biblioteca.catalogo.exemplar_adicionado` | Novo exemplar adicionado |
| `biblioteca.catalogo.exemplar_alterado` | Exemplar atualizado |
| `biblioteca.catalogo.genero_criado` | Novo gênero cadastrado |
| `biblioteca.catalogo.genero_alterado` | Gênero atualizado |
| `biblioteca.catalogo.autor_criado` | Novo autor cadastrado |
| `biblioteca.catalogo.autor_alterado` | Autor atualizado |

### Eventos Consumidos (Consumer)

| Fila | Routing Key Escutado | Ação |
|---|---|---|
| `catalogo.fila.emprestimo.criado` | `biblioteca.emprestimo.criado` | Marca exemplar como `Emprestado` |
| `catalogo.fila.devolucao.registrada` | `biblioteca.devolucao.registrada` | Marca exemplar como `Disponivel` |

> A conexão com o RabbitMQ possui **reconexão automática** com delay configurável via `RABBITMQ_RECONNECT_DELAY` (padrão: 5000ms).

---

## 🔐 Autenticação JWT

O middleware em `src/middlewares/auth.js` valida tokens JWT compartilhados entre os microserviços.

- **Secret:** `JWT_SECRET` (env) — fallback: `chave_secreta_biblioteca_2026`
- **Payload esperado:** `{ id, tipo }`
- **Tipos permitidos para escrita:** `Funcionario`, `Admin` (case-insensitive)
- **Header:** `Authorization: Bearer <token>`

Códigos de erro retornados:

| Code | Status | Descrição |
|---|---|---|
| `TOKEN_AUSENTE` | 401 | Header Authorization não enviado |
| `TOKEN_INVALIDO` | 401 | Token expirado ou inválido |
| `NAO_AUTENTICADO` | 401 | Middleware chamado sem token decodificado |
| `ACESSO_NEGADO` | 403 | Tipo de usuário sem permissão |

---

## 🔑 Gerenciamento de Secrets (Infisical)

Na inicialização, `src/config/infisical.js` busca as credenciais sensíveis no **Infisical** e as injeta no `process.env` antes de qualquer conexão:

- `DATABASE_URL` — string de conexão MySQL
- `RABBITMQ_URL` — string de conexão RabbitMQ

Configurado via variáveis de ambiente do container:

```
INFISICAL_CLIENT_ID
INFISICAL_CLIENT_SECRET
INFISICAL_PROJECT_ID
```

> Se `INFISICAL_CLIENT_ID` não estiver presente, o serviço utiliza as variáveis locais do `.env` (modo desenvolvimento).

---

## ⚙️ Configuração e Execução

### Pré-requisitos
- Node.js 22+
- MySQL com banco `db_catalogo_biblioteca` criado
- RabbitMQ acessível
- Docker (para deploy em container)

### Desenvolvimento local

```bash
# 1. Clonar o repositório
git clone https://github.com/Yasmin-Braga7/microservice-catalogo.git
cd microservice-catalogo

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais locais

# 4. Gerar o Prisma Client (não altera o banco)
npx prisma generate

# 5. Rodar em modo desenvolvimento
npm run dev
```

### Variáveis de ambiente (`.env`)

```env
DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/db_catalogo_biblioteca"
RABBITMQ_URL="amqp://user:senha@localhost:5672"
JWT_SECRET="chave_secreta_biblioteca_2026"
PORT=9502
RABBITMQ_RECONNECT_DELAY=5000
```

> Em produção, `DATABASE_URL` e `RABBITMQ_URL` são injetados pelo Infisical — não precisam estar no `.env`.

### Deploy com Docker

```bash
# Build e subir o container
docker compose up -d --build

# Ver logs
docker logs -f biblioteca-catalogo

# Parar
docker compose down
```

O `docker-compose.yml` expõe a porta **9502** e usa Infisical para secrets. As variáveis `DATABASE_URL` e `RABBITMQ_URL` ficam comentadas pois são carregadas dinamicamente na inicialização.

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor com hot-reload (nodemon) |
| `npm start` | Servidor em produção |
| `npm run db:migrate` | Executa migrations Prisma |
| `npm run db:generate` | Gera/atualiza o Prisma Client |

---

## 🚀 CI/CD (Jenkins)

O projeto possui dois Jenkinsfiles:

| Arquivo | Ambiente |
|---|---|
| `Jenkinsfile` | Windows (bat) |
| `Jenkinsfilelinux` | Linux (sh) |

**Pipeline:**
1. `Verificar Repositório` — checkout da branch `main` do GitHub
2. `Fazer Deploy com Compose` — `docker compose up -d --build`

> A integração com Infisical no `docker-compose.yml` está pendente da configuração do Jenkins pelo professor e não pode ser alterada por enquanto.

---

## 🐳 Docker

O `Dockerfile` usa **build multi-stage** baseado em `node:22-slim`:

- **Stage `builder`**: instala dependências (`npm ci --omit=dev`), copia o código e gera o Prisma Client
- **Stage final**: copia apenas `node_modules`, `src`, `prisma` e `package.json` — imagem enxuta

**Healthcheck** configurado: `GET /health` a cada 30s (timeout 5s, 3 tentativas).

---

## 🔐 Tratamento de Erros HTTP

| Status | Situação |
|---|---|
| `400` | Dados inválidos ou campos obrigatórios ausentes |
| `401` | Token JWT ausente ou inválido |
| `403` | Usuário sem permissão (não é Funcionário/Admin) |
| `404` | Registro não encontrado |
| `409` | Conflito — ex: ISBN ou código de barras duplicado (Prisma P2002) |
| `500` | Erro interno do servidor |

---

## 🧠 Conceitos Aplicados

- Arquitetura de Microserviços
- Comunicação assíncrona via RabbitMQ (topic exchange)
- Arquitetura em camadas (Routes → Controllers → Services → Prisma)
- Prisma `@map` / `@@map` para compatibilidade com schema existente
- JWT compartilhado entre microserviços com RBAC
- Gerenciamento de secrets com Infisical
- Docker multi-stage build
- CI/CD com Jenkins
- Reconexão automática ao RabbitMQ

---

## 👩‍💻 Desenvolvido por

**Yasmin Braga** — Aluna de Análise e Desenvolvimento de Sistemas (Senac RJ)

Projeto acadêmico: **Sistema de Gestão de Biblioteca** — Disciplina: Projeto Integrador
