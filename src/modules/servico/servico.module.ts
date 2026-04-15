import { Module } from '@nestjs/common';

import { AtualizarServicoUseCase } from '../../application/servico/atualizar-servico/AtualizarServicoUseCase';
import { CadastrarServicoUseCase } from '../../application/servico/cadastrar-servico/CadastrarServicoUseCase';
import { ListarServicosUseCase } from '../../application/servico/listar-servicos/ListarServicosUseCase';
import { RemoverServicoUseCase } from '../../application/servico/remover-servico/RemoverServicoUseCase';
import { ServicoController } from './servico.controller';

@Module({
  controllers: [ServicoController],
  providers: [
    CadastrarServicoUseCase,
    ListarServicosUseCase,
    AtualizarServicoUseCase,
    RemoverServicoUseCase,
  ],
})
export class ServicoModule {}
