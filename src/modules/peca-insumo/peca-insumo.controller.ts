import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PerfilAcesso } from '@prisma/client';

import { AtualizarEstoqueUseCase } from '../../application/peca-insumo/atualizar-estoque/AtualizarEstoqueUseCase';
import { CadastrarPecaUseCase } from '../../application/peca-insumo/cadastrar-peca/CadastrarPecaUseCase';
import { ListarPecasUseCase } from '../../application/peca-insumo/listar-pecas/ListarPecasUseCase';
import { Roles } from '../../common/decorators/roles.decorator';
import { AtualizarEstoqueDto } from './dto/atualizar-estoque.dto';
import { CriarPecaDto } from './dto/criar-peca.dto';
import { PecaResponseDto } from './dto/peca-response.dto';

@ApiTags('Peças e Insumos')
@ApiBearerAuth()
@Roles(PerfilAcesso.ADMINISTRADOR, PerfilAcesso.MECANICO)
@Controller('pecas')
export class PecaInsumoController {
  constructor(
    private readonly cadastrar: CadastrarPecaUseCase,
    private readonly listar: ListarPecasUseCase,
    private readonly atualizarEstoque: AtualizarEstoqueUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra peça ou insumo' })
  async create(@Body() dto: CriarPecaDto): Promise<PecaResponseDto> {
    const peca = await this.cadastrar.execute(dto);
    return PecaResponseDto.fromDomain(peca);
  }

  @Get()
  async list(): Promise<PecaResponseDto[]> {
    const pecas = await this.listar.execute();
    return pecas.map((p) => PecaResponseDto.fromDomain(p));
  }

  @Patch(':id/estoque')
  @ApiOperation({ summary: 'Atualiza estoque de peça/insumo' })
  async updateEstoque(
    @Param('id') id: string,
    @Body() dto: AtualizarEstoqueDto,
  ): Promise<PecaResponseDto> {
    const peca = await this.atualizarEstoque.execute({ id, ...dto });
    return PecaResponseDto.fromDomain(peca);
  }
}
