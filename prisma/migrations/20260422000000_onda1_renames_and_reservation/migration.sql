-- ================================================================
-- Onda 1: renames + novos status + reserva de estoque
-- ================================================================

-- ========================================
-- StatusOS: adiciona APROVADA e REPROVADA
-- ========================================
ALTER TYPE "StatusOS" ADD VALUE IF NOT EXISTS 'APROVADA';
ALTER TYPE "StatusOS" ADD VALUE IF NOT EXISTS 'REPROVADA';

-- ========================================
-- Cliente: cpfCnpj -> documento
-- ========================================
ALTER TABLE "Cliente" RENAME COLUMN "cpfCnpj" TO "documento";
ALTER INDEX "Cliente_cpfCnpj_key" RENAME TO "Cliente_documento_key";

-- ========================================
-- TipoPecaInsumo -> TipoInsumo (enum rename)
-- ========================================
ALTER TYPE "TipoPecaInsumo" RENAME TO "TipoInsumo";

-- ========================================
-- TipoItemOrcamento: PECA -> INSUMO
-- ========================================
ALTER TYPE "TipoItemOrcamento" RENAME VALUE 'PECA' TO 'INSUMO';

-- ========================================
-- PecaInsumo -> Insumo (table rename + new column quantidadeReservada)
-- ========================================
ALTER TABLE "PecaInsumo" RENAME TO "Insumo";
ALTER INDEX "PecaInsumo_pkey" RENAME TO "Insumo_pkey";
ALTER INDEX "PecaInsumo_codigo_key" RENAME TO "Insumo_codigo_key";
ALTER TABLE "Insumo" ADD COLUMN "quantidadeReservada" INTEGER NOT NULL DEFAULT 0;

-- ========================================
-- PecaUtilizada -> InsumoUtilizado (table rename + column pecaInsumoId -> insumoId)
-- ========================================
ALTER TABLE "PecaUtilizada" RENAME TO "InsumoUtilizado";
ALTER INDEX "PecaUtilizada_pkey" RENAME TO "InsumoUtilizado_pkey";
ALTER TABLE "InsumoUtilizado" RENAME COLUMN "pecaInsumoId" TO "insumoId";

-- Drop old FKs (names derived from PostgreSQL default naming on previous tables)
ALTER TABLE "InsumoUtilizado"
  DROP CONSTRAINT IF EXISTS "PecaUtilizada_execucaoDeServicoId_fkey";
ALTER TABLE "InsumoUtilizado"
  DROP CONSTRAINT IF EXISTS "PecaUtilizada_pecaInsumoId_fkey";

-- Recreate FKs with new names pointing to the renamed tables
ALTER TABLE "InsumoUtilizado"
  ADD CONSTRAINT "InsumoUtilizado_execucaoDeServicoId_fkey"
  FOREIGN KEY ("execucaoDeServicoId") REFERENCES "ExecucaoDeServico"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InsumoUtilizado"
  ADD CONSTRAINT "InsumoUtilizado_insumoId_fkey"
  FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ========================================
-- Usuario x ExecucaoDeServico: remove FK (mecanicoId continua como String)
-- ========================================
ALTER TABLE "ExecucaoDeServico"
  DROP CONSTRAINT IF EXISTS "ExecucaoDeServico_mecanicoId_fkey";

-- ========================================
-- OrcamentoToken: nova tabela para endpoint público
-- ========================================
CREATE TABLE "OrcamentoToken" (
  "id" TEXT NOT NULL,
  "ordemDeServicoId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "usado" BOOLEAN NOT NULL DEFAULT false,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usadoEm" TIMESTAMP(3),

  CONSTRAINT "OrcamentoToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrcamentoToken_token_key" ON "OrcamentoToken"("token");
