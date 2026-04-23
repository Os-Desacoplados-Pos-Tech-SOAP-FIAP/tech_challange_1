import { Module } from '@nestjs/common';

import { AdicionarItemUseCase } from '../../application/ordem-de-servico/adicionar-item/AdicionarItemUseCase';
import { AvancarStatusUseCase } from '../../application/ordem-de-servico/avancar-status/AvancarStatusUseCase';
import { ConsultarOSUseCase } from '../../application/ordem-de-servico/consultar-os/ConsultarOSUseCase';
import { CriarOSUseCase } from '../../application/ordem-de-servico/criar-os/CriarOSUseCase';
import { FinalizarExecucaoUseCase } from '../../application/ordem-de-servico/finalizar-execucao/FinalizarExecucaoUseCase';
import { ListarOSUseCase } from '../../application/ordem-de-servico/listar-os/ListarOSUseCase';
import { RegistrarExecucaoUseCase } from '../../application/ordem-de-servico/registrar-execucao/RegistrarExecucaoUseCase';
import { TempoMedioPorServicoUseCase } from '../../application/ordem-de-servico/tempo-medio-por-servico/TempoMedioPorServicoUseCase';
import { OrdemDeServicoController } from './ordem-de-servico.controller';

@Module({
  controllers: [OrdemDeServicoController],
  providers: [
    CriarOSUseCase,
    ConsultarOSUseCase,
    ListarOSUseCase,
    AvancarStatusUseCase,
    RegistrarExecucaoUseCase,
    FinalizarExecucaoUseCase,
    AdicionarItemUseCase,
    TempoMedioPorServicoUseCase,
  ],
})
export class OrdemDeServicoModule {}
