# Como criar uma Ordem de Serviço

Passo a passo completo para criar uma OS do zero, com as rotas e os JSONs prontos para uso.

> **Os IDs abaixo são fixos** — sempre os mesmos após qualquer reset do banco.
> Para reset completo: `npm run docker:down && docker volume rm tech_challange_1_oficina-db-data && npm run docker:up`

Todas as rotas (exceto login e rotas públicas) requerem o header:
```
Authorization: Bearer {accessToken}
```

---

## Referência rápida — dados do banco

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

## Pré-requisito — Login

**`POST /api/auth/login`**
```json
{
  "email": "atendente@oficina.local",
  "senha": "senha123"
}
```
Salve o `accessToken` da resposta.

> Para criar serviços e insumos use o admin: `admin@oficina.local` / `admin123`

---

## Passo 1 — Criar o cliente

> Os clientes da tabela acima já estão no banco — pule para o Passo 2 se for usar um existente.

**`POST /api/clientes`** _(perfil: ATENDENTE ou ADMINISTRADOR)_
```json
{
  "tipo": "PF",
  "documento": "912.384.650-71",
  "nome": "Roberto Alves",
  "email": "roberto.alves@gmail.com",
  "telefone": "(41) 99123-4567"
}
```
Salve o `id` retornado.

---

## Passo 2 — Criar o veículo

> Os veículos da tabela acima já estão no banco — pule este passo se for usar um existente.

**`POST /api/veiculos`** _(perfil: ATENDENTE ou ADMINISTRADOR)_
```json
{
  "placa": "PRT7K88",
  "marca": "Toyota",
  "modelo": "Corolla",
  "ano": 2023,
  "clienteId": "id-retornado-no-passo-1"
}
```
Salve o `id` retornado.

---

## Passo 3 — Verificar serviços e insumos disponíveis

> Já existem 6 serviços e 6 insumos no banco (veja a tabela acima). Use os IDs direto e pule para o Passo 4.

Caso queira criar novos (requer perfil **ADMINISTRADOR**):

**`POST /api/servicos`:**
```json
{
  "nome": "Troca de correia",
  "descricao": "Substituição da correia dentada e tensores",
  "valorPadrao": 320.00
}
```

**`POST /api/insumos`:**
```json
{
  "codigo": "PEC-010",
  "nome": "Fluido de freio DOT 4",
  "tipo": "INSUMO",
  "valorUnitario": 28.50,
  "quantidadeEstoque": 40,
  "estoqueMinimo": 8
}
```

---

## Passo 4 — Abrir a Ordem de Serviço

Exemplo usando **João Silva** e o **Gol**:

**`POST /api/ordens-de-servico`** _(perfil: ATENDENTE ou ADMINISTRADOR)_
```json
{
  "clienteId": "00000000-0000-4001-8000-000000000004",
  "veiculoId": "00000000-0000-4002-8000-000000000004",
  "observacoes": "Cliente relata barulho ao frear e consumo alto de combustível"
}
```
A OS é criada com status **`RECEBIDA`**. Salve o `id` e o `numero` da OS.

---

## Passo 5 — Adicionar itens ao orçamento

Repita para cada item. A OS precisa estar em `RECEBIDA`, `EM_DIAGNOSTICO` ou `AGUARDANDO_APROVACAO`.

**`POST /api/ordens-de-servico/{ID_DA_OS}/itens`**

Adicionando **Troca de pastilhas** (serviço):
```json
{
  "tipo": "SERVICO",
  "servicoId": "00000000-0000-4003-8000-000000000005",
  "quantidade": 1
}
```

Adicionando **Pastilha de freio dianteira** (insumo):
```json
{
  "tipo": "INSUMO",
  "insumoId": "00000000-0000-4004-8000-000000000003",
  "quantidade": 1
}
```

Adicionando **Limpeza de bicos** (serviço):
```json
{
  "tipo": "SERVICO",
  "servicoId": "00000000-0000-4003-8000-000000000003",
  "quantidade": 1
}
```

> Ao adicionar insumo, o estoque é **reservado** automaticamente.

---

## Passo 6 — Avançar o status até enviar o orçamento para aprovação

Cada chamada avança um passo. Não é possível pular etapas.

**`PATCH /api/ordens-de-servico/{ID_DA_OS}/status`**

```json
{ "novoStatus": "EM_DIAGNOSTICO" }
```
```json
{ "novoStatus": "AGUARDANDO_APROVACAO" }
```

> Ao mudar para `AGUARDANDO_APROVACAO`, o sistema gera automaticamente um token e envia um email para o cliente com o link do orçamento.

---

## Passo 6a — Cliente consulta e aprova o orçamento

O cliente recebe um email com um link público (sem necessidade de login):

**`GET /api/publico/os/{NUMERO_DA_OS}/orcamento?token={TOKEN_DO_EMAIL}`**

Esse link retorna todos os itens com quantidades e valores.

Depois, o cliente aprova ou reprova:

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

> O token é de uso único — após a decisão ele é invalidado.
>
> Atenção: um atendente autenticado **não consegue** fazer essa aprovação pela rota de status. A transição `AGUARDANDO_APROVACAO → APROVADA` só é permitida via token do cliente.

Se o cliente reprovar, a OS vai para `REPROVADA` e o fluxo encerra. Se aprovar, siga para o Passo 7.

---

## Passo 7 — Avançar para execução

**`PATCH /api/ordens-de-servico/{ID_DA_OS}/status`**

```json
{ "novoStatus": "EM_EXECUCAO" }
```

---

## Passo 8 — Registrar a execução do serviço

**`POST /api/ordens-de-servico/{ID_DA_OS}/execucoes`** _(perfil: MECANICO)_

A OS **precisa estar em `EM_EXECUCAO`**. Exemplo com Pedro Mecânico:
```json
{
  "servicoId": "00000000-0000-4003-8000-000000000005",
  "mecanicoId": "00000000-0000-4000-8000-000000000003",
  "inicio": "2026-04-27T13:00:00.000Z",
  "fim": "2026-04-27T14:30:00.000Z",
  "observacoes": "Pastilhas trocadas, sistema de freios testado",
  "insumosUtilizados": [
    {
      "insumoId": "00000000-0000-4004-8000-000000000003",
      "quantidade": 1
    }
  ]
}
```
> `fim` é opcional. Se omitido, finalize depois via `PATCH /{ID_DA_OS}/execucoes/{ID_DA_EXECUCAO}/finalizar`.

---

## Passo 9 — Finalizar e entregar

**`PATCH /api/ordens-de-servico/{ID_DA_OS}/status`**

```json
{ "novoStatus": "FINALIZADA" }
```
```json
{ "novoStatus": "ENTREGUE" }
```

---

## Fluxo de status

```
RECEBIDA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → APROVADA → EM_EXECUCAO → FINALIZADA → ENTREGUE
```

Casos alternativos:
- Cliente reprova: `AGUARDANDO_APROVACAO → REPROVADA`
- Cancelamento: qualquer status → `CANCELADA`
