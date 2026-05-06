# 📚 Microserviço – Catálogo de Livros  
## Sistema de Gestão de Biblioteca

Este microserviço é responsável pelo **catálogo da biblioteca**, permitindo o cadastro e gerenciamento de:

- 📖 Livros  
- ✍️ Autores  
- 🏷️ Gêneros  
- 📦 Exemplares (controle de estoque físico)  

Ele faz parte do projeto maior **Sistema de Gestão de Biblioteca**, que é composto por múltiplos microserviços:

1. Catálogo de Livros ✅ (este projeto)
2. Empréstimos e Devoluções
3. Usuários
4. Reservas de Livros
5. Relatórios e Estatísticas

---

# 🛠 Tecnologias Utilizadas

- Node.js  
- Fastify  
- Prisma ORM  
- Prisma Client v5 (`@prisma/client@5`)  
- MySQL  
- dotenv  
- nodemon  

---

# 🎯 Objetivo do Microserviço

Este microserviço tem como responsabilidade:

- Cadastrar livros  
- Associar livros a múltiplos autores  
- Associar livros a múltiplos gêneros  
- Controlar exemplares físicos  
- Manter status de disponibilidade  
- Servir dados para os demais microserviços  

> ⚠️ Este microserviço **não controla empréstimos**, apenas disponibiliza informações do catálogo.

---

# 🗂 Modelagem do Banco de Dados

## 📖 Entidades principais

### 🔹 Livro

- `livro_id`
- `livro_titulo`
- `livro_isbn`
- `livro_editora`
- `livro_ano_publicacao`
- `livro_sinopse`
- `livro_numero_paginas`
- `livro_idioma`
- `livro_status`(1 = ativo / 0 = inativo)

### 🔹 Autor

- `autor_id`
- `autor_nome`
- `autor_data_nascimento`
- `autor_nacionalidade`
- `autor_biografia`
- `autor_status`(1 = ativo / 0 = inativo)

### 🔹 Gênero

- `genero_id`
- `genero_nome`
- `genero_descricao`
> ⚠️ A tabela gênero não possui campo de status.

### 🔹 Exemplar

- `exemplar_id`
- `exemplar_codigo_barras`
- `exemplar_condicao`
- `exemplar_status`
  ('Disponivel','Emprestado','Manutencao','Perdido')
- `exemplar_data_aquisicao`
- `livro_id (FK)`

---

## 🔗 Relacionamentos

### 📘 Livro ↔ ✍️ Autor

Relação **N:N (Muitos para Muitos)** implementada através da tabela intermediária `livro_autor`.

#### Estrutura da tabela `livro_autor`:

- `livro_autor_id` (PK)
- `livro_id` (FK → livro.livro_id)
- `autor_id` (FK → autor.autor_id)

➡️ Um livro pode ter vários autores.  
➡️ Um autor pode escrever vários livros.

---

### 📘 Livro ↔ 🏷️ Gênero

Relação **N:N (Muitos para Muitos)** implementada através da tabela intermediária `livo_genero`.

#### Estrutura da tabela `livro_genero`:

- `livro_genero_id` (PK)
- `livro_id` (FK → livro.livro_id)
- `genero_id` (FK → genero.genero_id)

➡️ Um livro pode pertencer a vários gêneros.  
➡️ Um gênero pode classificar vários livros.

---

### 📘 Livro ↔ 📦 Exemplar

Relação **1:N (Um para Muitos)**.

A chave estrangeira está na tabela `exemplar`.

#### Estrutura relevante da tabela `exemplar`:

- `exemplar_id` (PK)
- `livro_id` (FK → livro.livro_id)

➡️ Um livro pode ter vários exemplares físicos.  
➡️ Cada exemplar pertence a apenas um livro.

---

# 🏗 Estrutura do Projeto:

```
catalogo-livros/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── config/
│   │   └── prisma.js
│   │
│   ├── controllers/
│   │   ├── livros.controller.js
│   │   ├── autores.controller.js
│   │   ├── generos.controller.js
│   │   └── exemplares.controller.js
│   │
│   ├── services/
│   │   ├── livros.service.js
│   │   ├── autores.service.js
│   │   ├── generos.service.js
│   │   └── exemplares.service.js
│   │
│   └── server.js
│
├── .env
├── package.json
└── README.md
```

---

### 🧱 Arquitetura em Camadas
Este projeto utiliza separação de responsabilidades:
- **Rotas(Fastify)** → recebem requisições
- **Controllers** → tratam request/response
- **Services** → contêm regras de negócio
- **Prisma CLient** → comunicação com o banco
- **MySQL** → persistência dos dados

---

# ⚙️ Configuração do Ambiente

## 1️⃣ Clonar o repositório

`git clone <url-do-repositorio>
cd catalogo-livros`

## 2️⃣ Instalar dependências

`npm install`

## 3️⃣ Configurar o banco de dados(Criar um banco MySQL)

`CREATE DATABASE db_catalogo_biblioteca;`

## 4️⃣ Configurar o arquivo .env

`DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/db_catalogo_biblioteca"
PORT=3000`

## 5️⃣ Executar migrations (isso irá: Criar as tabelas, Registrar histórico de migration, Gerar o Prisma Client)

`npx prisma migrate dev --name init`

## 6️⃣ Gerar Prisma Client (caso necessário)

`npx prisma generate`

## 7️⃣ Rodar o servidor

### 🔄 Modo desenvolvimento
`npm run dev`

### 🚀 Modo produção
`npm start`

# 🌐 Endpoints Principais

## 📘 Livros
| Método | Rota                                | Descrição             |
| ------ | ----------------------------------- | --------------------- |
| GET    | `/livros`                           | Lista todos os livros |
| GET    | `/livros/:id`                       | Busca livro por ID    |
| POST   | `/livros`                           | Cadastra novo livro   |
| PUT    | `/livros/:id`                       | Atualiza dados        |
| PATCH  | `/livros/:id/status`                | Altera status         |
| POST   | `/livros/:livroId/autores/:autorId` | Vincula autor         |

---

## ✍️ Autores
| Método | Rota                  | Descrição      |
| ------ | --------------------- | -------------- |
| GET    | `/autores`            | Lista todos    |
| GET    | `/autores/:id`        | Busca por ID   |
| POST   | `/autores`            | Cadastra autor |
| PUT    | `/autores/:id` | Atualiza dados do autor |
| PATCH  | `/autores/:id/status` | Altera status  |

---

## 🏷️ Gêneros
| Método | Rota           | Descrição                          |
| ------ | -------------- | ---------------------------------- |
| GET    | `/generos`     | Lista todos os gêneros cadastrados |
| GET    | `/generos/:id` | Busca um gênero específico pelo ID |
| POST   | `/generos`     | Cadastra um novo gênero            |
| PUT    | `/generos/:id` | Atualiza os dados de um gênero     |

---

## 📦 Exemplares
| Método | Rota              | Descrição                                      |
| ------ | ----------------- | ---------------------------------------------- |
| GET    | `/exemplares`     | Lista todos os exemplares cadastrados          |
| GET    | `/exemplares/:id` | Busca um exemplar específico pelo ID           |
| POST   | `/exemplares`     | Cadastra um novo exemplar vinculado a um livro |
| PUT    | `/exemplares/:id` | Atualiza a condição ou status do exemplar      |
| PATCH | `/exemplares/:id/status` | Remove um exemplar do sistema                  |

---

# 🔁 Fluxo da Requisição
1. Cliente envia requisição HTTP
2. Fastify recebe e direciona para rota
3. Controller trata requisição
4. Service executa regra de negócio
5. Prisma Client acessa banco
6. MySQL responde
7. API retorna resposta HTTP

---

# 🧠 Conceitos Aplicados
- Arquitetura em camadas
- Separação de responsabilidades
- Clean Code
- ORM (Prisma v5)
- Relacionamentos N:N
- Migrations controladas
- Variáveis de ambiente

---

# 🔐 Tratamento de Erros
- `400` – Dados inválidos
- `404` – Registro não encontrado
- `409` – Conflito (ex: ISBN duplicado – erro P2002 do Prisma)
- `500` – Erro interno do servidor

---

# 👨‍💻 Desenvolvido por: Yasmin Braga
Microserviço do projeto acadêmico:

**Sistema de Gestão de Biblioteca**
Disciplina: Projeto Integrador
