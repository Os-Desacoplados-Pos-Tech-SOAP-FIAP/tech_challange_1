import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PerfilAcesso } from '@prisma/client';

import { AprovarOrcamentoUseCase } from '../../application/ordem-de-servico/aprovar-orcamento/AprovarOrcamentoUseCase';
import { AvancarStatusUseCase } from '../../application/ordem-de-servico/avancar-status/AvancarStatusUseCase';
import { ConsultarOSUseCase } from '../../application/ordem-de-servico/consultar-os/ConsultarOSUseCase';
import { CriarOSUseCase } from '../../application/ordem-de-servico/criar-os/CriarOSUseCase';
import { ListarOSUseCase } from '../../application/ordem-de-servico/listar-os/ListarOSUseCase';
import { RecusarOrcamentoUseCase } from '../../application/ordem-de-servico/recusar-orcamento/RecusarOrcamentoUseCase';
import { RegistrarExecucaoUseCase } from '../../application/ordem-de-servico/registrar-execucao/RegistrarExecucaoUseCase';
import { Roles } from '../../common/decorators/roles.decorator';
import { AvancarStatusDto } from './dto/avancar-status.dto';
import { CriarOSDto } from './dto/criar-os.dto';
import { OSResponseDto } from './dto/os-response.dto';
import { RecusarOrcamentoDto } from './dto/recusar-orcamento.dto';
import { RegistrarExecucaoDto } from './dto/registrar-execucao.dto';

@ApiTags('Ordens de Serviço')
@ApiBearerAuth()
@Controller('ordens-de-servico')
export class OrdemDeServicoController {
  constructor(
    private readonly criarOS: CriarOSUseCase,
    private readonly consultarOS: ConsultarOSUseCase,
    private readonly listarOS: ListarOSUseCase,
    private readonly avancarStatus: AvancarStatusUseCase,
    private readonly aprovarOrcamento: AprovarOrcamentoUseCase,
    private readonly recusarOrcamento: RecusarOrcamentoUseCase,
    private readonly registrarExecucao: RegistrarExecucaoUseCase,
  ) {}

  @Post()
  @Roles(PerfilAcesso.ATENDENTE)
  @ApiOperation({ summary: 'Cria nova Ordem de Serviço' })
  async create(@Body() dto: CriarOSDto): Promise<OSResponseDto> {
    const os = await this.criarOS.execute(dto);
    return OSResponseDto.fromDomain(os);
  }

  @Get()
  @Roles(PerfilAcesso.ATENDENTE, PerfilAcesso.ADMINISTRADOR)
  async list(): Promise<OSResponseDto[]> {
    const oss = await this.listarOS.execute();
    return oss.map((o) => OSResponseDto.fromDomain(o));
  }

  @Get('metricas/tempo-medio')
  @Roles(PerfilAcesso.ADMINISTRADOR)
  @ApiOperation({ summary: 'Tempo médio de execução em minutos' })
  async tempoMedio(): Promise<{ tempoMedioMinutos: number }> {
    return { tempoMedioMinutos: await this.listarOS.tempoMedioExecucao() };
  }

  @Get(':id')
  @Roles(PerfilAcesso.ATENDENTE, PerfilAcesso.MECANICO, PerfilAcesso.ADMINISTRADOR)
  async getById(@Param('id') id: string): Promise<OSResponseDto> {
    const os = await this.consultarOS.porId(id);
    return OSResponseDto.fromDomain(os);
  }

  @Get('numero/:numero')
  @Roles(PerfilAcesso.ATENDENTE, PerfilAcesso.MECANICO, PerfilAcesso.ADMINISTRADOR)
  async getByNumero(@Param('numero', ParseIntPipe) numero: number): Promise<OSResponseDto> {
    const os = await this.consultarOS.porNumero(numero);
    return OSResponseDto.fromDomain(os);
  }

  @Patch(':id/status')
  @Roles(PerfilAcesso.ATENDENTE, PerfilAcesso.MECANICO)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: AvancarStatusDto,
  ): Promise<OSResponseDto> {
    const os = await this.avancarStatus.execute({ id, novoStatus: dto.novoStatus });
    return OSResponseDto.fromDomain(os);
  }

  @Post(':id/aprovar')
  @Roles(PerfilAcesso.ATENDENTE)
  async aprovar(@Param('id') id: string): Promise<OSResponseDto> {
    const os = await this.aprovarOrcamento.execute(id);
    return OSResponseDto.fromDomain(os);
  }

  @Post(':id/recusar')
  @Roles(PerfilAcesso.ATENDENTE)
  async recusar(
    @Param('id') id: string,
    @Body() dto: RecusarOrcamentoDto,
  ): Promise<OSResponseDto> {
    const os = await this.recusarOrcamento.execute({ id, motivo: dto.motivo });
    return OSResponseDto.fromDomain(os);
  }

  @Post(':id/execucoes')
  @Roles(PerfilAcesso.MECANICO)
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
      pecasUtilizadas: dto.pecasUtilizadas,
    });
    return OSResponseDto.fromDomain(os);
  }
}
