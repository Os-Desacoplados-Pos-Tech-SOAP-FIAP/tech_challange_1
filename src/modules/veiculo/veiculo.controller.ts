import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PerfilAcesso } from '@prisma/client';

import { AtualizarVeiculoUseCase } from '../../application/veiculo/atualizar-veiculo/AtualizarVeiculoUseCase';
import { BuscarVeiculoUseCase } from '../../application/veiculo/buscar-veiculo/BuscarVeiculoUseCase';
import { CadastrarVeiculoUseCase } from '../../application/veiculo/cadastrar-veiculo/CadastrarVeiculoUseCase';
import { ListarVeiculosUseCase } from '../../application/veiculo/listar-veiculos/ListarVeiculosUseCase';
import { RemoverVeiculoUseCase } from '../../application/veiculo/remover-veiculo/RemoverVeiculoUseCase';
import { Roles } from '../../common/decorators/roles.decorator';
import { AtualizarVeiculoDto } from './dto/atualizar-veiculo.dto';
import { CriarVeiculoDto } from './dto/criar-veiculo.dto';
import { VeiculoResponseDto } from './dto/veiculo-response.dto';

@ApiTags('Veículos')
@ApiBearerAuth()
@Roles(PerfilAcesso.ATENDENTE, PerfilAcesso.ADMINISTRADOR)
@Controller('veiculos')
export class VeiculoController {
  constructor(
    private readonly cadastrar: CadastrarVeiculoUseCase,
    private readonly buscar: BuscarVeiculoUseCase,
    private readonly listar: ListarVeiculosUseCase,
    private readonly atualizar: AtualizarVeiculoUseCase,
    private readonly remover: RemoverVeiculoUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra veículo' })
  async create(@Body() dto: CriarVeiculoDto): Promise<VeiculoResponseDto> {
    const veiculo = await this.cadastrar.execute(dto);
    return VeiculoResponseDto.fromDomain(veiculo);
  }

  @Get()
  @ApiOperation({ summary: 'Lista veículos (opcionalmente por cliente)' })
  async list(@Query('clienteId') clienteId?: string): Promise<VeiculoResponseDto[]> {
    const veiculos = await this.listar.execute(clienteId);
    return veiculos.map((v) => VeiculoResponseDto.fromDomain(v));
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<VeiculoResponseDto> {
    const veiculo = await this.buscar.porId(id);
    return VeiculoResponseDto.fromDomain(veiculo);
  }

  @Get('placa/:placa')
  async getByPlaca(@Param('placa') placa: string): Promise<VeiculoResponseDto> {
    const veiculo = await this.buscar.porPlaca(placa);
    return VeiculoResponseDto.fromDomain(veiculo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: AtualizarVeiculoDto,
  ): Promise<VeiculoResponseDto> {
    const veiculo = await this.atualizar.execute({ id, ...dto });
    return VeiculoResponseDto.fromDomain(veiculo);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.remover.execute(id);
  }
}
