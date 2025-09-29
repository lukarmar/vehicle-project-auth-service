# Auth Service

Serviço de autenticação da plataforma Vehicle Platform usando Keycloak.

## Descrição

Este serviço é responsável por:

- Gerenciamento de usuários e autenticação
- Integração com Keycloak
- Validação de tokens JWT
- Endpoints de autenticação (login, registro, validação)

## Tecnologias

- NestJS
- TypeScript
- PostgreSQL
- Keycloak
- Docker

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
# Database
AUTH_DB_HOST=localhost
AUTH_DB_PORT=5433
AUTH_DB_USER=auth_user
AUTH_DB_PASS=auth_pass
AUTH_DB_NAME=auth_db

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=vehicle-platform
KEYCLOAK_CLIENT_ID=auth-service
KEYCLOAK_CLIENT_SECRET=your-client-secret

# Service
PORT=3001
NODE_ENV=development
JWT_SECRET=your-jwt-secret
```

## Desenvolvimento

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- PostgreSQL

### Instalação

```bash
# Instalar dependências
npm install

# Subir infraestrutura (banco e Keycloak)
docker-compose up -d

# Executar migrações
npm run migration:run

# Executar em modo desenvolvimento
npm run start:dev
```

### Testes

```bash
# Testes unitários
npm run test

# Testes com cobertura
npm run test:cov

# Testes e2e
npm run test:e2e
```

## Endpoints

### Autenticação

- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro de novo usuário
- `POST /auth/validate-token` - Validação de token JWT
- `GET /auth/user/:id` - Informações do usuário

### Health Check

- `GET /health` - Verificação de saúde do serviço

## Docker

### Desenvolvimento

```bash
docker-compose up -d
```

### Produção

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Comunicação com outros serviços

Este serviço expõe uma API REST que pode ser consumida por outros serviços da plataforma, especialmente o `vehicle-service`.

### Endpoints para integração:

- `POST /auth/validate-token` - Validação de token para outros serviços
- `GET /auth/user/:id` - Buscar informações de usuário

## Estrutura do Projeto

```
src/
├── application/          # Camada de aplicação
│   ├── dtos/            # Data Transfer Objects
│   ├── interfaces/      # Interfaces de domínio
│   └── services/        # Serviços de aplicação
├── domain/              # Camada de domínio
│   ├── entities/        # Entidades de domínio
│   └── repositories/    # Interfaces de repositório
└── infrastructure/      # Camada de infraestrutura
    ├── database/        # Configuração de banco
    ├── keycloak/        # Integração Keycloak
    └── web/             # Controllers e rotas
```
