import { Module } from '@nestjs/common';

import { ConsultarOrcamentoPublicoUseCase } from '../../application/ordem-de-servico/consultar-orcamento-publico/ConsultarOrcamentoPublicoUseCase';
import { ConsultarOSUseCase } from '../../application/ordem-de-servico/consultar-os/ConsultarOSUseCase';
import { DecidirOrcamentoUseCase } from '../../application/ordem-de-servico/decidir-orcamento/DecidirOrcamentoUseCase';
import { PublicoController } from './publico.controller';

@Module({
  controllers: [PublicoController],
  providers: [ConsultarOSUseCase, DecidirOrcamentoUseCase, ConsultarOrcamentoPublicoUseCase],
})
export class PublicoModule {}
