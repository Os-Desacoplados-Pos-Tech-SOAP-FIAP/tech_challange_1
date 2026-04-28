import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PerfilAcesso } from '@prisma/client';

import { AtualizarEstoqueUseCase } from '../../application/insumo/atualizar-estoque/AtualizarEstoqueUseCase';
import { CadastrarInsumoUseCase } from '../../application/insumo/cadastrar-insumo/CadastrarInsumoUseCase';
import { ListarInsumosUseCase } from '../../application/insumo/listar-insumos/ListarInsumosUseCase';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiAuthResponses,
  ApiValidationResponses,
} from '../../common/decorators/swagger';
import { AtualizarEstoqueDto } from './dto/atualizar-estoque.dto';
import { CriarInsumoDto } from './dto/criar-insumo.dto';
import { InsumoResponseDto } from './dto/insumo-response.dto';

@ApiTags('Insumos')
@ApiBearerAuth()
@Roles(PerfilAcesso.ADMINISTRADOR, PerfilAcesso.MECANICO)
@Controller('insumos')
export class InsumoController {
  constructor(
    private readonly cadastrar: CadastrarInsumoUseCase,
    private readonly listar: ListarInsumosUseCase,
    private readonly atualizarEstoque: AtualizarEstoqueUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra peça ou insumo' })
  @ApiResponse({ status: 201, description: 'Peça/insumo criado', type: InsumoResponseDto })
  @ApiResponse({ status: 409, description: 'Código já cadastrado' })
  @ApiAuthResponses()
  @ApiValidationResponses()
  async create(@Body() dto: CriarInsumoDto): Promise<InsumoResponseDto> {
    const insumo = await this.cadastrar.execute(dto);
    return InsumoResponseDto.fromDomain(insumo);
  }

  @Get()
  @ApiOperation({ summary: 'Lista peças e insumos' })
  @ApiResponse({ status: 200, description: 'Lista retornada', type: InsumoResponseDto, isArray: true })
  @ApiAuthResponses()
  async list(): Promise<InsumoResponseDto[]> {
    const insumos = await this.listar.execute();
    return insumos.map((p) => InsumoResponseDto.fromDomain(p));
  }

  @Patch(':id/estoque')
  @ApiOperation({
    summary: 'Atualiza estoque de peça/insumo',
    description: 'Define nova quantidade e (opcionalmente) novo mínimo de estoque.',
  })
  @ApiResponse({ status: 200, description: 'Estoque atualizado', type: InsumoResponseDto })
  @ApiResponse({ status: 404, description: 'Peça/insumo não encontrado' })
  @ApiAuthResponses()
  @ApiValidationResponses()
  async updateEstoque(
    @Param('id') id: string,
    @Body() dto: AtualizarEstoqueDto,
  ): Promise<InsumoResponseDto> {
    const insumo = await this.atualizarEstoque.execute({ id, ...dto });
    return InsumoResponseDto.fromDomain(insumo);
  }
}
