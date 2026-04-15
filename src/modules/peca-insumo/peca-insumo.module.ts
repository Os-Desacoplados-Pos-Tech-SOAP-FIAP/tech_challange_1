import { Module } from '@nestjs/common';

import { AtualizarEstoqueUseCase } from '../../application/peca-insumo/atualizar-estoque/AtualizarEstoqueUseCase';
import { CadastrarPecaUseCase } from '../../application/peca-insumo/cadastrar-peca/CadastrarPecaUseCase';
import { ListarPecasUseCase } from '../../application/peca-insumo/listar-pecas/ListarPecasUseCase';
import { PecaInsumoController } from './peca-insumo.controller';

@Module({
  controllers: [PecaInsumoController],
  providers: [CadastrarPecaUseCase, ListarPecasUseCase, AtualizarEstoqueUseCase],
})
export class PecaInsumoModule {}
