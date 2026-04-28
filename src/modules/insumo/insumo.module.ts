import { Module } from '@nestjs/common';

import { AtualizarEstoqueUseCase } from '../../application/insumo/atualizar-estoque/AtualizarEstoqueUseCase';
import { CadastrarInsumoUseCase } from '../../application/insumo/cadastrar-insumo/CadastrarInsumoUseCase';
import { ListarInsumosUseCase } from '../../application/insumo/listar-insumos/ListarInsumosUseCase';
import { InsumoController } from './insumo.controller';

@Module({
  controllers: [InsumoController],
  providers: [CadastrarInsumoUseCase, ListarInsumosUseCase, AtualizarEstoqueUseCase],
})
export class InsumoModule {}
