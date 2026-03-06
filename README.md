# Tech Challenge - Sistema de Oficina Mecânica 🚗

## Sobre o Projeto

Este é o MVP (Minimum Viable Product) do back-end de um sistema integrado para oficinas mecânicas, desenvolvido como parte do Tech Challenge da pós-graduação. O sistema permite o gerenciamento completo de ordens de serviço, clientes, veículos e peças, com foco em eficiência e qualidade no atendimento.

### 🎯 Objetivo

Resolver os principais desafios de uma oficina mecânica de médio porte:
- Organizar o fluxo de atendimento e execução de serviços
- Controlar estoque de peças e insumos
- Permitir acompanhamento em tempo real das ordens de serviço
- Manter histórico completo de clientes e veículos
- Automatizar orçamentos e autorizações

## 🛠️ Stack Tecnológica

- **Node.js** - Plataforma de desenvolvimento
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados relacional
- **Prisma ORM** - Gerenciamento de banco de dados
- **JWT** - Autenticação e autorização
- **Jest** - Testes automatizados
- **Swagger** - Documentação da API
- **Docker** - Containerização

## 📋 Funcionalidades

### Fluxos Principais

#### 1. **Ordens de Serviço (OS)**
- ✅ Criação de OS com identificação do cliente (CPF/CNPJ)
- ✅ Cadastro/vinculação de veículos
- ✅ Inclusão de serviços solicitados
- ✅ Adição de peças e insumos necessários
- ✅ Geração automática de orçamento
- ✅ Envio para aprovação do cliente

#### 2. **Acompanhamento de OS**
- ✅ Status tracking completo:
  - 📥 Recebida
  - 🔧 Em diagnóstico
  - ⏳ Aguardando aprovação
  - ⚙️ Em execução
  - ✅ Finalizada
  - 🚗 Entregue
- ✅ Atualização automática de status
- ✅ Consulta pública para clientes

#### 3. **Gestão Administrativa**
- ✅ CRUD completo de clientes
- ✅ CRUD de veículos
- ✅ CRUD de serviços disponíveis
- ✅ CRUD de peças com controle de estoque
- ✅ Listagem e detalhamento de OS
- ✅ Monitoramento de tempo médio de execução

#### 4. **Segurança e Qualidade**
- ✅ Autenticação JWT para rotas administrativas
- ✅ Validação de dados sensíveis (CPF/CNPJ, placas)
- ✅ Testes unitários e de integração
- ✅ Cobertura mínima de 80% nos domínios críticos

## 🏗️ Arquitetura

O projeto segue os princípios do **Domain-Driven Design (DDD)** com a seguinte estrutura:

```
src/
├── domain/           # Camada de domínio (entidades, value objects, agregados)
├── application/      # Casos de uso e serviços da aplicação
├── infrastructure/   # Implementações concretas (repositórios, ORM)
├── interfaces/       # Controllers, middlewares, rotas
└── shared/          # Utilitários, constantes, erros
```

### 📊 Documentação DDD

- **Event Storming completo** disponível no Miro
- **Linguagem Ubíqua** documentada
- **Diagramas** de domínio e fluxos

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- npm ou yarn

### Instalação e Execução

1. **Clone o repositório**
```bash
git clone [url-do-repositorio]
cd tech-challenge-oficina
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. **Execute com Docker Compose**
```bash
docker-compose up -d
```

4. **Acesse a aplicação**
- API: http://localhost:3000
- Documentação Swagger: http://localhost:3000/api-docs
- Banco de dados: localhost:5432

### Execução sem Docker

1. **Instale as dependências**
```bash
npm install
```

2. **Configure o banco de dados PostgreSQL**
```bash
# Certifique-se de ter o PostgreSQL instalado e rodando
npm run prisma:migrate
```

3. **Inicie a aplicação**
```bash
npm run dev
```

## 📚 API Endpoints

### Públicos (sem autenticação)
- `GET /api/os/:id/acompanhamento` - Acompanhar OS por ID

### Administrativos (requer JWT)
#### Clientes
- `POST /api/clientes` - Criar cliente
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/:id` - Buscar cliente
- `PUT /api/clientes/:id` - Atualizar cliente
- `DELETE /api/clientes/:id` - Remover cliente

#### Veículos
- `POST /api/veiculos` - Cadastrar veículo
- `GET /api/veiculos` - Listar veículos
- `GET /api/veiculos/cliente/:clienteId` - Veículos por cliente

#### Serviços
- `POST /api/servicos` - Criar serviço
- `GET /api/servicos` - Listar serviços
- `PUT /api/servicos/:id` - Atualizar serviço

#### Peças
- `POST /api/pecas` - Cadastrar peça
- `GET /api/pecas` - Listar peças
- `PUT /api/pecas/:id/estoque` - Atualizar estoque

#### Ordens de Serviço
- `POST /api/os` - Criar OS
- `GET /api/os` - Listar OS
- `GET /api/os/:id` - Detalhar OS
- `PUT /api/os/:id/status` - Atualizar status
- `POST /api/os/:id/aprovar` - Aprovar orçamento

## 🧪 Testes

```bash
# Executar testes unitários
npm run test

# Executar testes com cobertura
npm run test:coverage

# Executar testes e2e
npm run test:e2e
```

## 🐳 Comandos Docker Úteis

```bash
# Construir as imagens
docker-compose build

# Iniciar os containers
docker-compose up -d

# Parar os containers
docker-compose down

# Visualizar logs
docker-compose logs -f app

# Executar migrações do banco
docker-compose exec app npm run prisma:migrate
```

## 🔒 Segurança

- **JWT Tokens** para autenticação
- **Validação de dados** com regex para CPF/CNPJ e placas
- **Sanitização** de inputs
- **Rate limiting** para prevenção de ataques
- **Helmet.js** para headers de segurança

## 📊 Relatório de Vulnerabilidades

Foi realizado um scan completo de vulnerabilidades no código utilizando as seguintes ferramentas:
- **SonarQube** - Análise estática de código
- **Snyk** - Verificação de dependências
- **OWASP ZAP** - Testes de penetração básicos

O relatório completo está disponível na pasta `/docs/relatorio-vulnerabilidades.pdf`

## 👥 Equipe

| Nome | Discord |
|------|---------|
| [Nome do Integrante 1] | @username1 |
| [Nome do Integrante 2] | @username2 |
| [Nome do Integrante 3] | @username3 |

## 📝 Documentação

- [Documentação DDD no Miro](link-do-miro)
- [Swagger UI](http://localhost:3000/api-docs)
- [Relatório de Vulnerabilidades](/docs/relatorio-vulnerabilidades.pdf)

## 📄 Licença

Este projeto é parte integrante do curso de Pós-graduação em Arquitetura de Software.

---
**Observação**: Este é um MVP e está em desenvolvimento ativo. Novas funcionalidades e melhorias serão implementadas nas próximas fases do projeto.
