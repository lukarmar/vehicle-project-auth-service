# Auth Service

[![codecov](https://codecov.io/gh/lukarmar/vehicle-project-auth-service/branch/develop/graph/badge.svg?token=jCZyg4J37V)](https://codecov.io/gh/lukarmar/vehicle-project-auth-service)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/nestjs-10.x-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-UNLICENSED-red)](LICENSE)

## 📋 Visão Geral

O **Auth Service** é um microsserviço de autenticação desenvolvido em NestJS que faz parte da plataforma de revenda de veículos. Este serviço é responsável por gerenciar usuários, autenticação e autorização, utilizando Keycloak como provedor de identidade.

## 🏗️ Arquitetura

O serviço segue os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, organizando o código em camadas bem definidas:

```
src/
├── application/          # Camada de Aplicação
│   ├── dtos/            # Data Transfer Objects
│   ├── interfaces/      # Interfaces de contratos
│   └── services/        # Serviços de aplicação
├── domain/              # Camada de Domínio
│   ├── entities/        # Entidades de domínio
│   └── repositories/    # Interfaces de repositórios
└── infrastructure/      # Camada de Infraestrutura
    ├── database/        # Configuração e entidades do banco
    ├── keycloak/        # Integração com Keycloak
    └── web/            # Controllers e middlewares
```

## 🚀 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **NestJS** - Framework para Node.js
- **TypeScript** - Linguagem de programação
- **PostgreSQL** - Banco de dados relacional
- **TypeORM** - ORM para TypeScript e JavaScript
- **Keycloak** - Servidor de identidade e acesso
- **JWT** - JSON Web Tokens para autenticação
- **Docker** - Containerização
- **Jest** - Framework de testes
- **Swagger** - Documentação da API

## 📦 Funcionalidades

### Autenticação

- ✅ Registro de novos usuários
- ✅ Login com email e senha
- ✅ Validação de tokens JWT
- ✅ Integração com Keycloak
- ✅ Renovação de tokens

### Autorização

- ✅ Validação de roles de usuário
- ✅ Controle de acesso baseado em roles
- ✅ Sincronização de usuários com Keycloak

### Gerenciamento de Usuários

- ✅ Criação de usuários no sistema local e Keycloak
- ✅ Consulta de informações de usuário
- ✅ Ativação/desativação de usuários
- ✅ Atualização de informações pessoais

## 🛠️ Configuração Local

### Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Node.js** 18+ (para desenvolvimento local)
- **Git** para controle de versão

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```bash
# Banco de Dados
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

# JWT
JWT_SECRET=your-jwt-secret

# Aplicação
NODE_ENV=development
PORT=3001
```

### Instalação e Execução

#### 1. Usando Docker (Recomendado)

```bash
# Clone o repositório
git clone <repository-url>
cd auth-service

# Execute o script de desenvolvimento
chmod +x dev.sh
./dev.sh
```

O script `dev.sh` irá:

- Parar containers existentes
- Construir e iniciar todos os serviços
- Configurar o banco de dados PostgreSQL
- Inicializar o Keycloak com realm pré-configurado
- Iniciar a aplicação em modo de desenvolvimento

#### 2. Desenvolvimento Local (sem Docker)

```bash
# Instalar dependências
npm install

# Iniciar apenas banco e Keycloak via Docker
docker-compose up -d auth-db keycloak

# Executar a aplicação em modo desenvolvimento
npm run start:dev
```

### Serviços Disponíveis

Após a inicialização completa, os seguintes serviços estarão disponíveis:

| Serviço        | URL                            | Descrição                          |
| -------------- | ------------------------------ | ---------------------------------- |
| Auth Service   | http://localhost:3001          | API principal                      |
| API Docs       | http://localhost:3001/api/docs | Documentação Swagger               |
| Health Check   | http://localhost:3001/health   | Status da aplicação                |
| Keycloak Admin | http://localhost:8080          | Console administrativo do Keycloak |
| PostgreSQL     | localhost:5433                 | Banco de dados                     |

## 🧪 Testes

### Executar Todos os Testes

```bash
npm run test
```

### Testes com Cobertura

```bash
npm run test:cov
```

### Testes em Modo Watch

```bash
npm run test:watch
```

### Testes End-to-End

```bash
npm run test:e2e
```

### Visualizar Relatório de Cobertura

Após executar `npm run test:cov`, abra o arquivo:

```
coverage/index.html
```

## 🔧 Scripts Disponíveis

| Script                | Descrição                                     |
| --------------------- | --------------------------------------------- |
| `npm run build`       | Compila o projeto TypeScript                  |
| `npm run start`       | Inicia a aplicação                            |
| `npm run start:dev`   | Inicia em modo desenvolvimento com hot reload |
| `npm run start:debug` | Inicia em modo debug                          |
| `npm run start:prod`  | Inicia em modo produção                       |
| `npm run lint`        | Executa o linter ESLint                       |
| `npm run format`      | Formata o código com Prettier                 |

## 📡 Endpoints da API

### Autenticação

| Método | Endpoint          | Descrição                    |
| ------ | ----------------- | ---------------------------- |
| POST   | `/auth/register`  | Registrar novo usuário       |
| POST   | `/auth/login`     | Login do usuário             |
| GET    | `/auth/validate`  | Validar token JWT            |
| GET    | `/auth/user-info` | Obter informações do usuário |

### Health Check

| Método | Endpoint  | Descrição                     |
| ------ | --------- | ----------------------------- |
| GET    | `/health` | Verificar status da aplicação |

Para documentação completa da API, acesse: http://localhost:3001/api/docs

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco de Dados

```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps

# Reiniciar serviços
docker-compose restart auth-db
```

#### 2. Keycloak não Inicializa

```bash
# Verificar logs do Keycloak
docker-compose logs keycloak

# Limpar volumes e reiniciar
docker-compose down -v
docker-compose up --build
```

#### 3. Porta já em Uso

```bash
# Verificar processos na porta 3001
sudo lsof -i :3001

# Parar todos os containers
docker-compose down
```

## 🔐 Configuração do Keycloak

O serviço vem com uma configuração pré-definida do Keycloak incluindo:

- **Realm**: `vehicle-platform`
- **Client ID**: `auth-service`
- **Usuário Admin**: `admin/admin`

### Acessar Console Administrativo

1. Acesse: http://localhost:8080
2. Login: `admin/admin`
3. Selecione o realm: `vehicle-platform`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para dúvidas ou problemas, entre em contato através:

- Issues do GitHub
- Email: [seu-email@exemplo.com]

---

**Desenvolvido com ❤️ pela equipe da Vehicle Platform**

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
