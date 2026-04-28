import { Controller, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PerfilAcesso } from '@prisma/client';

import { RegistrarPontoExecucaoUseCase } from '../../application/ordem-de-servico/registrar-ponto-execucao/RegistrarPontoExecucaoUseCase';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiAuthResponses,
  ApiValidationResponses,
} from '../../common/decorators/swagger';
import { UsuarioAutenticado } from '../../infrastructure/auth/jwt.strategy';
import { OSResponseDto } from './dto/os-response.dto';

@ApiTags('Itens de Orçamento')
@ApiBearerAuth()
@Controller('itens-de-orcamento')
export class ItensDeOrcamentoController {
  constructor(
    private readonly registrarPontoExecucao: RegistrarPontoExecucaoUseCase,
  ) {}

  @Post(':id/execucoes')
  @HttpCode(200)
  @Roles(PerfilAcesso.MECANICO)
  @ApiOperation({
    summary: 'Registra início ou fim da execução de um item de orçamento',
    description:
      'Primeira chamada marca o início da execução; a próxima marca o fim. O mecânico é identificado pelo token. Apenas itens do tipo SERVICO são executáveis.',
  })
  @ApiResponse({ status: 200, description: 'Ponto de execução registrado', type: OSResponseDto })
  @ApiResponse({ status: 404, description: 'Item de orçamento não encontrado' })
  @ApiAuthResponses()
  @ApiValidationResponses()
  async registrar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UsuarioAutenticado,
  ): Promise<OSResponseDto> {
    const os = await this.registrarPontoExecucao.execute({
      itemOrcamentoId: id,
      mecanicoId: user.id,
    });
    return OSResponseDto.fromDomain(os);
  }
}
