-- ================================================================
-- Onda 2: execução vinculada a item de orçamento + status simplificado
-- ================================================================

-- ========================================
-- Drop tabela InsumoUtilizado (não é mais usada — itens de orçamento
-- do tipo INSUMO continuam representando o consumo no orçamento)
-- ========================================
DROP TABLE IF EXISTS "InsumoUtilizado";

-- ========================================
-- ExecucaoDeServico: remove observacoes, adiciona itemOrcamentoId
-- ========================================
-- Limpa execuções existentes (não há como mapear para itens 1:1
-- retroativamente; este projeto não tem dados produtivos a preservar).
DELETE FROM "ExecucaoDeServico";

ALTER TABLE "ExecucaoDeServico" DROP COLUMN IF EXISTS "observacoes";

ALTER TABLE "ExecucaoDeServico" ADD COLUMN "itemOrcamentoId" TEXT NOT NULL;

CREATE UNIQUE INDEX "ExecucaoDeServico_itemOrcamentoId_key"
  ON "ExecucaoDeServico"("itemOrcamentoId");

ALTER TABLE "ExecucaoDeServico"
  ADD CONSTRAINT "ExecucaoDeServico_itemOrcamentoId_fkey"
  FOREIGN KEY ("itemOrcamentoId") REFERENCES "ItemOrcamento"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- StatusOS: remove valor CANCELADA
-- ========================================
-- Converte qualquer CANCELADA remanescente para REPROVADA (terminal).
UPDATE "OrdemDeServico" SET "status" = 'REPROVADA' WHERE "status" = 'CANCELADA';

ALTER TYPE "StatusOS" RENAME TO "StatusOS_old";
CREATE TYPE "StatusOS" AS ENUM (
  'RECEBIDA',
  'EM_DIAGNOSTICO',
  'AGUARDANDO_APROVACAO',
  'APROVADA',
  'REPROVADA',
  'EM_EXECUCAO',
  'FINALIZADA',
  'ENTREGUE'
);
ALTER TABLE "OrdemDeServico" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "OrdemDeServico"
  ALTER COLUMN "status" TYPE "StatusOS"
  USING ("status"::text::"StatusOS");
ALTER TABLE "OrdemDeServico" ALTER COLUMN "status" SET DEFAULT 'RECEBIDA';
DROP TYPE "StatusOS_old";
