import { Module } from '@nestjs/common';

import { ConsultarOSUseCase } from '../../application/ordem-de-servico/consultar-os/ConsultarOSUseCase';
import { PublicoController } from './publico.controller';

@Module({
  controllers: [PublicoController],
  providers: [ConsultarOSUseCase],
})
export class PublicoModule {}
