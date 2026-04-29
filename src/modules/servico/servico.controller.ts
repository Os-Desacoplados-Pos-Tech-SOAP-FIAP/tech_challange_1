import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PerfilAcesso } from '@prisma/client';

import { AtualizarServicoUseCase } from '../../application/servico/atualizar-servico/AtualizarServicoUseCase';
import { CadastrarServicoUseCase } from '../../application/servico/cadastrar-servico/CadastrarServicoUseCase';
import { ListarServicosUseCase } from '../../application/servico/listar-servicos/ListarServicosUseCase';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiAuthResponses,
  ApiValidationResponses,
} from '../../common/decorators/swagger';
import { AtualizarServicoDto } from './dto/atualizar-servico.dto';
import { CriarServicoDto } from './dto/criar-servico.dto';
import { ServicoResponseDto } from './dto/servico-response.dto';

@ApiTags('Serviços')
@ApiBearerAuth()
@Roles(PerfilAcesso.ADMINISTRADOR)
@Controller('servicos')
export class ServicoController {
  constructor(
    private readonly cadastrar: CadastrarServicoUseCase,
    private readonly listar: ListarServicosUseCase,
    private readonly atualizar: AtualizarServicoUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra serviço',
    description: 'Cria um serviço no catálogo com valor padrão.',
  })
  @ApiResponse({ status: 201, description: 'Serviço criado', type: ServicoResponseDto })
  @ApiAuthResponses()
  @ApiValidationResponses()
  async create(@Body() dto: CriarServicoDto): Promise<ServicoResponseDto> {
    const servico = await this.cadastrar.execute(dto);
    return ServicoResponseDto.fromDomain(servico);
  }

  @Get()
  @Roles(PerfilAcesso.ADMINISTRADOR, PerfilAcesso.ATENDENTE, PerfilAcesso.MECANICO)
  @ApiOperation({ summary: 'Lista serviços do catálogo' })
  @ApiResponse({ status: 200, description: 'Lista retornada', type: ServicoResponseDto, isArray: true })
  @ApiAuthResponses()
  async list(): Promise<ServicoResponseDto[]> {
    const servicos = await this.listar.execute();
    return servicos.map((s) => ServicoResponseDto.fromDomain(s));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza serviço' })
  @ApiResponse({ status: 200, description: 'Serviço atualizado', type: ServicoResponseDto })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  @ApiAuthResponses()
  @ApiValidationResponses()
  async update(
    @Param('id') id: string,
    @Body() dto: AtualizarServicoDto,
  ): Promise<ServicoResponseDto> {
    const servico = await this.atualizar.execute({ id, ...dto });
    return ServicoResponseDto.fromDomain(servico);
  }
}
