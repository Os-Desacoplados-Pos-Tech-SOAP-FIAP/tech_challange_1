import { Module } from '@nestjs/common';

import { AdicionarItemUseCase } from '../../application/ordem-de-servico/adicionar-item/AdicionarItemUseCase';
import { AvancarStatusUseCase } from '../../application/ordem-de-servico/avancar-status/AvancarStatusUseCase';
import { ConsultarOSUseCase } from '../../application/ordem-de-servico/consultar-os/ConsultarOSUseCase';
import { CriarOSUseCase } from '../../application/ordem-de-servico/criar-os/CriarOSUseCase';
import { ListarOSUseCase } from '../../application/ordem-de-servico/listar-os/ListarOSUseCase';
import { RegistrarPontoExecucaoUseCase } from '../../application/ordem-de-servico/registrar-ponto-execucao/RegistrarPontoExecucaoUseCase';
import { TempoMedioPorServicoUseCase } from '../../application/ordem-de-servico/tempo-medio-por-servico/TempoMedioPorServicoUseCase';
import { ItensDeOrcamentoController } from './itens-de-orcamento.controller';
import { OrdemDeServicoController } from './ordem-de-servico.controller';

@Module({
  controllers: [OrdemDeServicoController, ItensDeOrcamentoController],
  providers: [
    CriarOSUseCase,
    ConsultarOSUseCase,
    ListarOSUseCase,
    AvancarStatusUseCase,
    RegistrarPontoExecucaoUseCase,
    AdicionarItemUseCase,
    TempoMedioPorServicoUseCase,
  ],
})
export class OrdemDeServicoModule {}
