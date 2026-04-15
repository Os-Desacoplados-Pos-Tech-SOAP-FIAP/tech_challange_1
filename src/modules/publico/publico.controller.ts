import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ConsultarOSUseCase } from '../../application/ordem-de-servico/consultar-os/ConsultarOSUseCase';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Público')
@Controller('publico')
export class PublicoController {
  constructor(private readonly consultarOS: ConsultarOSUseCase) {}

  @Public()
  @Get('os/:numero/status')
  @ApiOperation({ summary: 'Consulta status público de uma OS pelo número' })
  async status(@Param('numero', ParseIntPipe) numero: number) {
    const os = await this.consultarOS.porNumero(numero);
    return {
      numero: os.numero.value,
      status: os.status.value,
      valorEstimado: os.valorEstimado.value,
      atualizadoEm: os.atualizadoEm,
    };
  }
}
