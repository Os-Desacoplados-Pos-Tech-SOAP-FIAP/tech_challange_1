# Fluxo completo da oficina mecânica

Da chegada do cliente até a saída do carro.

> **IDs abaixo são fixos após reset do banco.**
> Reset: `npm run docker:down && docker volume rm tech_challange_1_oficina-db-data && npm run docker:up`

---

## Referência rápida — dados do seed

### Usuários

| Perfil        | Email                   | Senha    | ID                                     |
|---------------|-------------------------|----------|----------------------------------------|
| ADMINISTRADOR | admin@oficina.local     | admin123 | `00000000-0000-4000-8000-000000000001` |
| ATENDENTE     | atendente@oficina.local | senha123 | `00000000-0000-4000-8000-000000000002` |
| MECANICO      | mecanico1@oficina.local | senha123 | `00000000-0000-4000-8000-000000000003` |
| MECANICO      | mecanico2@oficina.local | senha123 | `00000000-0000-4000-8000-000000000004` |

### Clientes

| Nome                     | Documento          | ID                                     |
|--------------------------|--------------------|----------------------------------------|
| Ana Lima                 | 620.324.110-59     | `00000000-0000-4001-8000-000000000001` |
| Carlos Ferreira          | 049.435.860-23     | `00000000-0000-4001-8000-000000000002` |
| Fernanda Souza Ribeiro   | 467.749.620-09     | `00000000-0000-4001-8000-000000000003` |
| João Silva               | 587.603.570-02     | `00000000-0000-4001-8000-000000000004` |
| Maria Souza              | 370.252.660-94     | `00000000-0000-4001-8000-000000000005` |
| Transportadora ACME LTDA | 46.483.933/0001-88 | `00000000-0000-4001-8000-000000000006` |

### Veículos

| Placa   | Modelo   | Cliente                  | ID                                     |
|---------|----------|--------------------------|----------------------------------------|
| LIM4H56 | Civic    | Ana Lima                 | `00000000-0000-4002-8000-000000000001` |
| ABC2D34 | Uno      | Carlos Ferreira          | `00000000-0000-4002-8000-000000000002` |
| ACM2A02 | Daily    | Fernanda Souza Ribeiro   | `00000000-0000-4002-8000-000000000003` |
| ABC1D23 | Gol      | João Silva               | `00000000-0000-4002-8000-000000000004` |
| DEF3G45 | Onix     | Maria Souza              | `00000000-0000-4002-8000-000000000005` |
| ACM1A01 | Sprinter | Transportadora ACME LTDA | `00000000-0000-4002-8000-000000000006` |

### Serviços

| Nome               | Valor     | ID                                     |
|--------------------|-----------|----------------------------------------|
| Alinhamento        | R$ 90,00  | `00000000-0000-4003-8000-000000000001` |
| Balanceamento      | R$ 80,00  | `00000000-0000-4003-8000-000000000002` |
| Limpeza de bicos   | R$ 160,00 | `00000000-0000-4003-8000-000000000003` |
| Revisão geral      | R$ 600,00 | `00000000-0000-4003-8000-000000000004` |
| Troca de pastilhas | R$ 250,00 | `00000000-0000-4003-8000-000000000005` |
| Troca de óleo      | R$ 120,50 | `00000000-0000-4003-8000-000000000006` |

### Insumos

| Código  | Nome                        | Tipo   | Valor     | ID                                     |
|---------|-----------------------------|--------|-----------|----------------------------------------|
| INS-001 | Óleo 5W30 1L                | INSUMO | R$ 45,00  | `00000000-0000-4004-8000-000000000001` |
| PEC-001 | Filtro de óleo              | PECA   | R$ 35,90  | `00000000-0000-4004-8000-000000000002` |
| PEC-002 | Pastilha de freio dianteira | PECA   | R$ 180,00 | `00000000-0000-4004-8000-000000000003` |
| PEC-003 | Correia dentada             | PECA   | R$ 220,00 | `00000000-0000-4004-8000-000000000004` |
| PEC-004 | Pneu aro 15                 | PECA   | R$ 420,00 | `00000000-0000-4004-8000-000000000005` |
| PEC-005 | Bateria de 60Ah             | PECA   | R$ 650,75 | `00000000-0000-4004-8000-000000000006` |

---

## Diagrama de estados da OS

```
                    [adicionar 1º item]
  RECEBIDA ──────────────────────────────► EM_DIAGNOSTICO
                                                  │
                                    [POST /status] │
                                                  ▼
                                       AGUARDANDO_APROVACAO
                                          │         │
                              [token: APROVADA]  [token: REPROVADA]
                                          │         │
                                          ▼         ▼
                                       APROVADA   REPROVADA (fim)
                                          │
                         [1ª execução de item]
                                          │
                                          ▼
                                     EM_EXECUCAO
                                          │
                    [todas execuções concluídas]
                                          │
                                          ▼
                                       FINALIZADA
                                          │
                                [POST /status] │
                                          ▼
                                       ENTREGUE
```

**Transições manuais** (requer `POST /api/ordens-de-servico/:id/status`):
- `EM_DIAGNOSTICO → AGUARDANDO_APROVACAO` _(requer ao menos 1 item no orçamento)_
- `FINALIZADA → ENTREGUE`

**Transições automáticas** (disparadas por ações do sistema):
- `RECEBIDA → EM_DIAGNOSTICO` ao adicionar o 1º item
- `AGUARDANDO_APROVACAO → APROVADA` quando cliente aprova via token
- `AGUARDANDO_APROVACAO → REPROVADA` quando cliente reprova via token
- `APROVADA → EM_EXECUCAO` na 1ª chamada de execução de qualquer item
- `EM_EXECUCAO → FINALIZADA` quando todas as execuções de itens SERVICO são concluídas

---

## Fluxo passo a passo

### Pré-requisito — Login

Todas as rotas (exceto as públicas) exigem o header:
```
Authorization: Bearer {accessToken}
```

**`POST /api/auth/login`**
```json
{
  "email": "atendente@oficina.local",
  "senha": "senha123"
}
```
> Use `admin@oficina.local` / `admin123` para operações administrativas (cadastrar serviços, insumos, usuários).

---

### Etapa 1 — Cadastro do cliente _(se ainda não existir)_

**Perfil: ATENDENTE ou ADMINISTRADOR**

**`POST /api/clientes`**
```json
{
  "tipo": "PF",
  "documento": "854.679.790-00",
  "nome": "Roberto Alves",
  "email": "roberto.alves@gmail.com",
  "telefone": "(41) 99123-4567"
}
```

Para buscar se o cliente já existe:

**`GET /api/clientes/documento/85467979000`**

---

### Etapa 2 — Cadastro do veículo _(se ainda não existir)_

**Perfil: ATENDENTE ou ADMINISTRADOR**

**`POST /api/veiculos`**
```json
{
  "placa": "PRT7K88",
  "marca": "Toyota",
  "modelo": "Corolla",
  "ano": 2023,
  "clienteId": "{ID_DO_CLIENTE}"
}
```

> Substitua `{ID_DO_CLIENTE}` pelo `id` retornado no cadastro da Etapa 1. Para clientes do seed, use o ID da tabela de referência acima.

Para listar veículos de um cliente:

**`GET /api/veiculos?clienteId={ID_DO_CLIENTE}`**

---

### Etapa 3 — Abertura da Ordem de Serviço

**Perfil: ATENDENTE ou ADMINISTRADOR**

**`POST /api/ordens-de-servico`**
```json
{
  "clienteId": "00000000-0000-4001-8000-000000000004",
  "veiculoId": "00000000-0000-4002-8000-000000000004",
  "observacoes": "Cliente relata barulho ao frear e consumo alto de combustível"
}
```

**Resposta:** OS criada com `status: "RECEBIDA"`. Salve o `id` e o `numero` da OS.

---

### Etapa 4 — Adição de itens ao orçamento

**Perfil: ATENDENTE, MECANICO ou ADMINISTRADOR**

**`POST /api/ordens-de-servico/{ID_DA_OS}/itens`**

> **Automático:** ao adicionar o 1º item, a OS passa de `RECEBIDA` para `EM_DIAGNOSTICO`.

Adicionando um serviço (Troca de pastilhas):
```json
{
  "tipo": "SERVICO",
  "servicoId": "00000000-0000-4003-8000-000000000005",
  "quantidade": 1
}
```

Adicionando outro serviço (Limpeza de bicos):
```json
{
  "tipo": "SERVICO",
  "servicoId": "00000000-0000-4003-8000-000000000003",
  "quantidade": 1
}
```

Adicionando uma peça (Pastilha de freio):
```json
{
  "tipo": "INSUMO",
  "insumoId": "00000000-0000-4004-8000-000000000003",
  "quantidade": 1
}
```

> Ao adicionar um INSUMO, a quantidade é **reservada no estoque** automaticamente.
>
> A resposta de cada chamada inclui os `itensOrcamento` com seus IDs — **guarde o `id` de cada item do tipo SERVICO**, pois será necessário na etapa de execução.

---

### Etapa 5 — Envio do orçamento para aprovação

**Perfil: ATENDENTE ou ADMINISTRADOR**

**`POST /api/ordens-de-servico/{ID_DA_OS}/status`** _(sem body)_

> O backend determina o próximo status automaticamente. Neste ponto, avança de `EM_DIAGNOSTICO` para `AGUARDANDO_APROVACAO`.
>
> **Automático:** o sistema gera um token e envia um email ao cliente com o link do orçamento.

---

### Etapa 6 — Aprovação pelo cliente _(fluxo público, sem login)_

O cliente recebe um email com o link:
```
GET /api/publico/os/{NUMERO_DA_OS}/orcamento?token={TOKEN_DO_EMAIL}
```

Esse link retorna os itens do orçamento com valores. Após avaliar, o cliente decide:

**`POST /api/publico/os/{NUMERO_DA_OS}/orcamento/decisao`**

Aprovando:
```json
{
  "token": "token-recebido-no-email",
  "decisao": "APROVADA"
}
```

Reprovando:
```json
{
  "token": "token-recebido-no-email",
  "decisao": "REPROVADA"
}
```

> O token é de **uso único** — após a decisão ele é invalidado.
>
> Se aprovado: OS avança para `APROVADA` automaticamente.
> Se reprovado: OS vai para `REPROVADA` e o fluxo encerra.

Para consultar apenas o status (sem token):

**`GET /api/publico/os/{NUMERO_DA_OS}/status`**

---

### Etapa 7 — Execução dos serviços _(mecânico)_

**Perfil: MECANICO** — o mecânico é identificado pelo JWT (não precisa enviar ID no body)

A rota usa o **ID do item de orçamento** (obtido na resposta da Etapa 4), não o ID da OS.

**`POST /api/itens-de-orcamento/{ID_DO_ITEM}/execucoes`** _(sem body)_

- **1ª chamada:** marca o **início** da execução → OS passa automaticamente de `APROVADA` para `EM_EXECUCAO`
- **2ª chamada:** marca o **fim** da execução → tempo é calculado automaticamente

Repita para cada item do tipo `SERVICO` presente no orçamento.

> Quando **todas** as execuções de itens SERVICO forem concluídas, a OS transiciona automaticamente para `FINALIZADA`.

Como obter os IDs dos itens:

**`GET /api/ordens-de-servico/{ID_DA_OS}`** → campo `itensOrcamento[].id` onde `tipo === "SERVICO"`

---

### Etapa 8 — Entrega do veículo

**Perfil: ATENDENTE ou ADMINISTRADOR**

**`POST /api/ordens-de-servico/{ID_DA_OS}/status`** _(sem body)_

> Avança de `FINALIZADA` para `ENTREGUE`. Fluxo concluído.

---

## Rotas de consulta e administração

### Acompanhamento de OS

```
GET /api/ordens-de-servico                       → lista todas as OS
GET /api/ordens-de-servico/{id}                  → busca por ID
GET /api/ordens-de-servico/numero/{numero}        → busca por número sequencial
```

### Métricas _(ADMINISTRADOR)_

```
GET /api/ordens-de-servico/metricas/tempo-medio               → tempo médio geral
GET /api/ordens-de-servico/metricas/tempo-medio-por-servico   → tempo médio por serviço
```

### Cadastros de suporte

```
POST /api/auth/registrar                         → cria novo usuário             (ADMINISTRADOR)
POST /api/servicos                               → cadastra serviço no catálogo  (ADMINISTRADOR)
PUT  /api/servicos/{id}                          → atualiza serviço              (ADMINISTRADOR)
GET  /api/servicos                               → lista serviços                (todos os perfis)
POST /api/insumos                                → cadastra peça/insumo          (ADMINISTRADOR)
GET  /api/insumos                                → lista insumos                 (todos os perfis)
PATCH /api/insumos/{id}/estoque                  → atualiza estoque              (ADMINISTRADOR)
```

---

## Permissões por perfil

| Perfil        | O que pode fazer |
|---------------|-----------------|
| ADMINISTRADOR | Tudo             |
| ATENDENTE     | Clientes, veículos, abrir/consultar OS, adicionar itens, avançar status |
| MECANICO      | Consultar OS, registrar execução de itens, consultar/atualizar insumos |
| _(público)_   | Consultar status de OS, ver orçamento com token, aprovar/reprovar com token |
