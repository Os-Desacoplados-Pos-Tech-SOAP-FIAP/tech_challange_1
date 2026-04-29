-- ================================================================
-- Remove a coluna `estoqueMinimo` da tabela Insumo
-- (campo nunca utilizado em nenhuma regra de negócio)
-- ================================================================

ALTER TABLE "Insumo" DROP COLUMN "estoqueMinimo";
