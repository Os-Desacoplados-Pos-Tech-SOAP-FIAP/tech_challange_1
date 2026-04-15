import { Module } from '@nestjs/common';

import { AprovarOrcamentoUseCase } from '../../application/ordem-de-servico/aprovar-orcamento/AprovarOrcamentoUseCase';
import { AvancarStatusUseCase } from '../../application/ordem-de-servico/avancar-status/AvancarStatusUseCase';
import { ConsultarOSUseCase } from '../../application/ordem-de-servico/consultar-os/ConsultarOSUseCase';
import { CriarOSUseCase } from '../../application/ordem-de-servico/criar-os/CriarOSUseCase';
import { ListarOSUseCase } from '../../application/ordem-de-servico/listar-os/ListarOSUseCase';
import { RecusarOrcamentoUseCase } from '../../application/ordem-de-servico/recusar-orcamento/RecusarOrcamentoUseCase';
import { RegistrarExecucaoUseCase } from '../../application/ordem-de-servico/registrar-execucao/RegistrarExecucaoUseCase';
import { OrdemDeServicoController } from './ordem-de-servico.controller';

@Module({
  controllers: [OrdemDeServicoController],
  providers: [
    CriarOSUseCase,
    ConsultarOSUseCase,
    ListarOSUseCase,
    AvancarStatusUseCase,
    AprovarOrcamentoUseCase,
    RecusarOrcamentoUseCase,
    RegistrarExecucaoUseCase,
  ],
})
export class OrdemDeServicoModule {}
