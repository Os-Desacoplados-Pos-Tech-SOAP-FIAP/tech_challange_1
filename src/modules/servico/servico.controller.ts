import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PerfilAcesso } from '@prisma/client';

import { AtualizarServicoUseCase } from '../../application/servico/atualizar-servico/AtualizarServicoUseCase';
import { CadastrarServicoUseCase } from '../../application/servico/cadastrar-servico/CadastrarServicoUseCase';
import { ListarServicosUseCase } from '../../application/servico/listar-servicos/ListarServicosUseCase';
import { RemoverServicoUseCase } from '../../application/servico/remover-servico/RemoverServicoUseCase';
import { Roles } from '../../common/decorators/roles.decorator';
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
    private readonly remover: RemoverServicoUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra serviço' })
  async create(@Body() dto: CriarServicoDto): Promise<ServicoResponseDto> {
    const servico = await this.cadastrar.execute(dto);
    return ServicoResponseDto.fromDomain(servico);
  }

  @Get()
  async list(): Promise<ServicoResponseDto[]> {
    const servicos = await this.listar.execute();
    return servicos.map((s) => ServicoResponseDto.fromDomain(s));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: AtualizarServicoDto,
  ): Promise<ServicoResponseDto> {
    const servico = await this.atualizar.execute({ id, ...dto });
    return ServicoResponseDto.fromDomain(servico);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.remover.execute(id);
  }
}
