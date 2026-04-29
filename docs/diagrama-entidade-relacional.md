# Diagrama Entidade-Relacionamento

```mermaid
erDiagram

    Cliente {
        String id PK
        TipoCliente tipo
        String documento UK
        String nome
        String email
        String telefone
        DateTime criadoEm
        DateTime atualizadoEm
    }

    Veiculo {
        String id PK
        String placa UK
        String marca
        String modelo
        Int ano
        String clienteId FK
        DateTime criadoEm
        DateTime atualizadoEm
    }

    Usuario {
        String id PK
        String nome
        String email UK
        String senha
        PerfilAcesso perfil
        Boolean ativo
        DateTime criadoEm
        DateTime atualizadoEm
    }

    Servico {
        String id PK
        String nome
        String descricao
        Decimal valorPadrao
        Boolean ativo
        DateTime criadoEm
        DateTime atualizadoEm
    }

    Insumo {
        String id PK
        String codigo UK
        String nome
        TipoInsumo tipo
        Decimal valorUnitario
        Int quantidadeEstoque
        Int quantidadeReservada
        Int estoqueMinimo
        DateTime criadoEm
        DateTime atualizadoEm
    }

    OrdemDeServico {
        String id PK
        Int numero UK
        String clienteId FK
        String veiculoId FK
        StatusOS status
        Decimal valorEstimado
        String observacoes
        DateTime criadoEm
        DateTime atualizadoEm
    }

    ItemOrcamento {
        String id PK
        String ordemDeServicoId FK
        TipoItemOrcamento tipo
        String referenciaId
        String descricao
        Int quantidade
        Decimal valorUnitario
        Decimal valorTotal
        DateTime criadoEm
    }

    ExecucaoDeServico {
        String id PK
        String ordemDeServicoId FK
        String itemOrcamentoId FK
        String servicoId
        String mecanicoId
        DateTime inicio
        DateTime fim
        Int tempoExecucaoMinutos
        DateTime criadoEm
    }

    OrcamentoToken {
        String id PK
        String ordemDeServicoId
        String token UK
        Boolean usado
        DateTime criadoEm
        DateTime usadoEm
    }

    Cliente ||--o{ Veiculo : "possui"
    Cliente ||--o{ OrdemDeServico : "solicita"
    Veiculo ||--o{ OrdemDeServico : "é atendido em"
    OrdemDeServico ||--o{ ItemOrcamento : "contém"
    OrdemDeServico ||--o{ ExecucaoDeServico : "gera"
    ItemOrcamento ||--o| ExecucaoDeServico : "origina"
```

## Enums

| Enum | Valores |
|------|---------|
| **PerfilAcesso** | `ADMINISTRADOR`, `ATENDENTE`, `MECANICO` |
| **StatusOS** | `RECEBIDA`, `EM_DIAGNOSTICO`, `AGUARDANDO_APROVACAO`, `APROVADA`, `REPROVADA`, `EM_EXECUCAO`, `FINALIZADA`, `ENTREGUE` |
| **TipoCliente** | `PF`, `PJ` |
| **TipoInsumo** | `PECA`, `INSUMO` |
| **TipoItemOrcamento** | `SERVICO`, `INSUMO` |

## Descrição dos Relacionamentos

- **Cliente → Veículo**: um cliente pode possuir zero ou mais veículos.
- **Cliente → OrdemDeServico**: um cliente pode ter zero ou mais ordens de serviço.
- **Veículo → OrdemDeServico**: um veículo pode estar em zero ou mais ordens de serviço.
- **OrdemDeServico → ItemOrcamento**: uma OS contém um ou mais itens de orçamento (cascade delete).
- **OrdemDeServico → ExecucaoDeServico**: uma OS pode gerar zero ou mais execuções de serviço (cascade delete).
- **ItemOrcamento → ExecucaoDeServico**: um item de orçamento pode originar no máximo uma execução (relação 1:0..1, cascade delete).
- **OrcamentoToken**: entidade independente que armazena tokens de aprovação/reprovação de orçamento vinculados a uma OS (sem FK declarada no Prisma, referência via `ordemDeServicoId`).
