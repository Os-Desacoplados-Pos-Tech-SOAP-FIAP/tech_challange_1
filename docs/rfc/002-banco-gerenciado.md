# RFC 002 — Banco de dados gerenciado

**Status:** decidido (RDS PostgreSQL 16) · **Data:** 2026-08-19

## Problema

A aplicação precisa de um banco gerenciado, com o modelo relacional documentado e
justificado. A Fase 1 já havia escolhido PostgreSQL; a Fase 3 pede a decisão formalizada e
o serviço gerenciado definido.

## Por que PostgreSQL (revalidação)

A Ordem de Serviço é um agregado que cruza cliente, veículo, serviços e insumos, e o
fechamento da OS exige atualizações atômicas (baixa de estoque, recálculo do orçamento e
mudança de status na mesma transação).

1. **Transações ACID** garantem que essas operações multi-entidade ocorram por inteiro ou
   não ocorram.
2. **Integridade referencial** impede, no nível do banco, estados que violam invariantes do
   domínio (OS sem cliente, item apontando para peça inexistente).
3. **DECIMAL** preserva a precisão monetária de peças, serviços e total da OS.
4. **Enums nativos** restringem o ciclo de vida da OS aos estados válidos.
5. **Funções analíticas** (AVG, EXTRACT) atendem ao monitoramento de tempo médio de
   execução sem ferramenta externa.
6. **Prisma** tem suporte de primeira classe, com migrações versionadas e tipagem gerada.

MongoDB foi descartado por ser o domínio fortemente relacional; MySQL é viável, mas oferece
menos em tipos avançados e consultas analíticas; SQLite não atende a concorrência.

## Opções de serviço gerenciado

| Opção | A favor | Contra |
| --- | --- | --- |
| **RDS PostgreSQL 16 db.t3.micro** (escolhida) | Custo previsível (~US$ 0,40/dia), Multi-AZ e backups por configuração, já provisionado na Fase 2 | Capacidade fixa; escalar exige mudar a classe |
| Aurora Serverless v2 | Escala automática por ACU, alta disponibilidade nativa | Custo mínimo maior; complexidade desnecessária para a carga do projeto |
| PostgreSQL em contêiner no cluster | Custo próximo de zero | **Não atende** ao requisito de banco gerenciado; perde backups e disponibilidade |

## Decisão

**RDS PostgreSQL 16**, `db.t3.micro`, em subnets privadas, criptografado em repouso, com o
acesso à porta 5432 liberado exclusivamente para os security groups dos nós do EKS e da
Lambda de autenticação. Credenciais geradas pelo Terraform e publicadas no Secrets Manager
— em nenhum momento versionadas.

Para produção real, as flags já existentes cobrem o endurecimento: `db_multi_az`,
`db_deletion_protection` e `db_skip_final_snapshot = false`. No ambiente do desafio elas
ficam desligadas para que o ciclo de subir e destruir seja rápido e barato.

## Modelo relacional

O diagrama entidade-relacionamento está em [`../DER.png`](../DER.png) e os relacionamentos
são descritos no README do repositório da aplicação. O esquema é versionado em
`prisma/schema.prisma`, com migrações aplicadas por um initContainer antes de cada rollout.
