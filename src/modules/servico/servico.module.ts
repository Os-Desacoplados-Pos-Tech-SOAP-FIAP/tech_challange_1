import { Module } from '@nestjs/common';

import { AtualizarServicoUseCase } from '../../application/servico/atualizar-servico/AtualizarServicoUseCase';
import { CadastrarServicoUseCase } from '../../application/servico/cadastrar-servico/CadastrarServicoUseCase';
import { ListarServicosUseCase } from '../../application/servico/listar-servicos/ListarServicosUseCase';
import { ServicoController } from './servico.controller';

@Module({
  controllers: [ServicoController],
  providers: [CadastrarServicoUseCase, ListarServicosUseCase, AtualizarServicoUseCase],
})
export class ServicoModule {}
