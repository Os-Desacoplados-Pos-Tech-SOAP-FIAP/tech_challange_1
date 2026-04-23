import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PerfilAcesso } from '@prisma/client';

import { AdicionarItemUseCase } from '../../application/ordem-de-servico/adicionar-item/AdicionarItemUseCase';
import { AvancarStatusUseCase } from '../../application/ordem-de-servico/avancar-status/AvancarStatusUseCase';
import { ConsultarOSUseCase } from '../../application/ordem-de-servico/consultar-os/ConsultarOSUseCase';
import { CriarOSUseCase } from '../../application/ordem-de-servico/criar-os/CriarOSUseCase';
import { FinalizarExecucaoUseCase } from '../../application/ordem-de-servico/finalizar-execucao/FinalizarExecucaoUseCase';
import { ListarOSUseCase } from '../../application/ordem-de-servico/listar-os/ListarOSUseCase';
import { RegistrarExecucaoUseCase } from '../../application/ordem-de-servico/registrar-execucao/RegistrarExecucaoUseCase';
import { TempoMedioPorServicoUseCase } from '../../application/ordem-de-servico/tempo-medio-por-servico/TempoMedioPorServicoUseCase';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiAuthResponses,
  ApiValidationResponses,
} from '../../common/decorators/swagger';
import { UsuarioAutenticado } from '../../infrastructure/auth/jwt.strategy';
import { AdicionarItemDto } from './dto/adicionar-item.dto';
import { AvancarStatusDto } from './dto/avancar-status.dto';
import { CriarOSDto } from './dto/criar-os.dto';
import { OSResponseDto } from './dto/os-response.dto';
import { RegistrarExecucaoDto } from './dto/registrar-execucao.dto';
import { TempoMedioPorServicoResponseDto } from './dto/tempo-medio-por-servico-response.dto';

@ApiTags('Ordens de Serviço')
@ApiBearerAuth()
@Controller('ordens-de-servico')
export class OrdemDeServicoController {
  constructor(
    private readonly criarOS: CriarOSUseCase,
    private readonly consultarOS: ConsultarOSUseCase,
    private readonly listarOS: ListarOSUseCase,
    private readonly avancarStatus: AvancarStatusUseCase,
    private readonly registrarExecucao: RegistrarExecucaoUseCase,
    private readonly finalizarExecucaoUseCase: FinalizarExecucaoUseCase,
    private readonly adicionarItemUseCase: AdicionarItemUseCase,
    private readonly tempoMedioPorServicoUseCase: TempoMedioPorServicoUseCase,
  ) {}

  @Post()
  @Roles(PerfilAcesso.ATENDENTE, PerfilAcesso.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Cria nova Ordem de Serviço',
    description: 'Inicializa uma OS vinculada a cliente e veículo, em status RECEBIDA.',
  })
  @ApiResponse({ status: 201, description: 'OS criada', type: OSResponseDto })
  @ApiResponse({ status: 404, description: 'Cliente ou veículo não encontrados' })
  @ApiAuthResponses()
  @ApiValidationResponses()
  async create(@Body() dto: CriarOSDto): Promise<OSResponseDto> {
    const os = await this.criarOS.execute(dto);
    return OSResponseDto.fromDomain(os);
  }

  @Get()
  @Roles(PerfilAcesso.ATENDENTE, PerfilAcesso.ADMINISTRADOR)
  @ApiOperation({ summary: 'Lista ordens de serviço' })
  @ApiResponse({ status: 200, description: 'Lista retornada', type: OSResponseDto, isArray: true })
  @ApiAuthResponses()
  async list(): Promise<OSResponseDto[]> {
    const oss = await this.listarOS.execute();
    return oss.map((o) => OSResponseDto.fromDomain(o));
  }

  @Get('metricas/tempo-medio')
  @Roles(PerfilAcesso.ADMINISTRADOR)
  @ApiOperation({ summary: 'Tempo médio de execução (minutos) agregado' })
  @ApiResponse({ status: 200, description: 'Média em minutos calculada' })
  @ApiAuthResponses()
  async tempoMedio(): Promise<{ tempoMedioMinutos: number }> {
    return { tempoMedioMinutos: await this.listarOS.tempoMedioExecucao() };
  }

  @Get('metricas/tempo-medio-por-servico')
  @Roles(PerfilAcesso.ADMINISTRADOR)
  @ApiOperation({ summary: 'Tempo médio de execução por tipo de serviço (minutos)' })
  @ApiResponse({ status: 200, description: 'Lista de médias por serviço', type: TempoMedioPorServicoResponseDto, isArray: true })
  @ApiAuthResponses()
  async tempoMedioPorServico(): Promise<TempoMedioPorServicoResponseDto[]> {
    const items = await this.tempoMedioPorServicoUseCase.execute();
    return items.map(TempoMedioPorServicoResponseDto.fromOutput);
  }

  @Get(':id')
  @Roles(PerfilAcesso.ATENDENTE, PerfilAcesso.MECANICO, PerfilAcesso.ADMINISTRADOR)
  @ApiOperation({ summary: 'Busca OS por ID' })
  @ApiResponse({ status: 200, description: 'OS encontrada', type: OSResponseDto })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  @ApiAuthResponses()
  async getById(@Param('id') id: string): Promise<OSResponseDto> {
    const os = await this.consultarOS.porId(id);
    return OSResponseDto.fromDomain(os);
  }

  @Get('numero/:numero')
  @Roles(PerfilAcesso.ATENDENTE, PerfilAcesso.MECANICO, PerfilAcesso.ADMINISTRADOR)
  @ApiOperation({ summary: 'Busca OS por número sequencial' })
  @ApiResponse({ status: 200, description: 'OS encontrada', type: OSResponseDto })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  @ApiAuthResponses()
  async getByNumero(@Param('numero', ParseIntPipe) numero: number): Promise<OSResponseDto> {
    const os = await this.consultarOS.porNumero(numero);
    return OSResponseDto.fromDomain(os);
  }

  @Patch(':id/status')
  @Roles(PerfilAcesso.ATENDENTE, PerfilAcesso.MECANICO, PerfilAcesso.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Avança status da OS',
    description:
      'Transição validada pelo domínio via máquina de estados. O perfil autenticado é checado contra a lista de perfis autorizados para a transição solicitada.',
  })
  @ApiResponse({ status: 200, description: 'Status atualizado', type: OSResponseDto })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  @ApiResponse({ status: 403, description: 'Perfil não autorizado para esta transição' })
  @ApiAuthResponses()
  @ApiValidationResponses()
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: AvancarStatusDto,
    @CurrentUser() user: UsuarioAutenticado,
  ): Promise<OSResponseDto> {
    const os = await this.avancarStatus.execute({
      id,
      novoStatus: dto.novoStatus,
      perfilSolicitante: user.perfil,
    });
    return OSResponseDto.fromDomain(os);
  }

  @Post(':id/itens')
  @Roles(PerfilAcesso.ATENDENTE, PerfilAcesso.MECANICO, PerfilAcesso.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Adiciona serviço ou insumo ao orçamento da OS',
    description:
      'Insumos são reservados no estoque no momento da inclusão. Só é permitido em RECEBIDA, EM_DIAGNOSTICO ou AGUARDANDO_APROVACAO.',
  })
  @ApiResponse({ status: 201, description: 'Item adicionado', type: OSResponseDto })
  @ApiResponse({ status: 404, description: 'OS, serviço ou insumo não encontrado' })
  @ApiAuthResponses()
  @ApiValidationResponses()
  async adicionarItem(
    @Param('id') id: string,
    @Body() dto: AdicionarItemDto,
  ): Promise<OSResponseDto> {
    const os = await this.adicionarItemUseCase.execute(
      dto.tipo === 'SERVICO'
        ? {
            ordemDeServicoId: id,
            tipo: 'SERVICO',
            servicoId: dto.servicoId!,
            quantidade: dto.quantidade,
          }
        : {
            ordemDeServicoId: id,
            tipo: 'INSUMO',
            insumoId: dto.insumoId!,
            quantidade: dto.quantidade,
          },
    );
    return OSResponseDto.fromDomain(os);
  }

  @Post(':id/execucoes')
  @Roles(PerfilAcesso.MECANICO)
  @ApiOperation({
    summary: 'Registra execução de serviço na OS',
    description: 'Exige OS em status EM_EXECUCAO. Se omitir fim, execução fica em andamento.',
  })
  @ApiResponse({ status: 201, description: 'Execução registrada', type: OSResponseDto })
  @ApiResponse({ status: 404, description: 'OS ou insumo não encontrado' })
  @ApiAuthResponses()
  @ApiValidationResponses()
  async registrarExec(
    @Param('id') id: string,
    @Body() dto: RegistrarExecucaoDto,
  ): Promise<OSResponseDto> {
    const os = await this.registrarExecucao.execute({
      ordemDeServicoId: id,
      servicoId: dto.servicoId,
      mecanicoId: dto.mecanicoId,
      inicio: dto.inicio,
      fim: dto.fim,
      observacoes: dto.observacoes,
      insumosUtilizados: dto.insumosUtilizados,
    });
    return OSResponseDto.fromDomain(os);
  }

  @Patch(':id/execucoes/:execId/finalizar')
  @Roles(PerfilAcesso.MECANICO)
  @ApiOperation({
    summary: 'Finaliza execução iniciada (marca fim = agora)',
    description:
      'Encerra uma execução de serviço que foi registrada sem data de término e calcula o tempo decorrido.',
  })
  @ApiResponse({ status: 200, description: 'Execução finalizada', type: OSResponseDto })
  @ApiResponse({ status: 404, description: 'OS ou execução não encontrada' })
  @ApiAuthResponses()
  @ApiValidationResponses()
  async finalizarExec(
    @Param('id') id: string,
    @Param('execId') execId: string,
  ): Promise<OSResponseDto> {
    const os = await this.finalizarExecucaoUseCase.execute({
      ordemDeServicoId: id,
      execucaoId: execId,
    });
    return OSResponseDto.fromDomain(os);
  }
}
