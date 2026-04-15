import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PerfilAcesso } from '@prisma/client';

import { AtualizarClienteUseCase } from '../../application/cliente/atualizar-cliente/AtualizarClienteUseCase';
import { BuscarClienteUseCase } from '../../application/cliente/buscar-cliente/BuscarClienteUseCase';
import { CadastrarClienteUseCase } from '../../application/cliente/cadastrar-cliente/CadastrarClienteUseCase';
import { ListarClientesUseCase } from '../../application/cliente/listar-clientes/ListarClientesUseCase';
import { RemoverClienteUseCase } from '../../application/cliente/remover-cliente/RemoverClienteUseCase';
import { Roles } from '../../common/decorators/roles.decorator';
import { AtualizarClienteDto } from './dto/atualizar-cliente.dto';
import { ClienteResponseDto } from './dto/cliente-response.dto';
import { CriarClienteDto } from './dto/criar-cliente.dto';

@ApiTags('Clientes')
@ApiBearerAuth()
@Roles(PerfilAcesso.ATENDENTE, PerfilAcesso.ADMINISTRADOR)
@Controller('clientes')
export class ClienteController {
  constructor(
    private readonly cadastrar: CadastrarClienteUseCase,
    private readonly buscar: BuscarClienteUseCase,
    private readonly atualizar: AtualizarClienteUseCase,
    private readonly listar: ListarClientesUseCase,
    private readonly remover: RemoverClienteUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo cliente' })
  async create(@Body() dto: CriarClienteDto): Promise<ClienteResponseDto> {
    const cliente = await this.cadastrar.execute(dto);
    return ClienteResponseDto.fromDomain(cliente);
  }

  @Get()
  @ApiOperation({ summary: 'Lista clientes' })
  async list(): Promise<ClienteResponseDto[]> {
    const clientes = await this.listar.execute();
    return clientes.map((c) => ClienteResponseDto.fromDomain(c));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca cliente por ID' })
  async getById(@Param('id') id: string): Promise<ClienteResponseDto> {
    const cliente = await this.buscar.porId(id);
    return ClienteResponseDto.fromDomain(cliente);
  }

  @Get('documento/:cpfCnpj')
  @ApiOperation({ summary: 'Busca cliente por CPF/CNPJ' })
  async getByDocumento(@Param('cpfCnpj') cpfCnpj: string): Promise<ClienteResponseDto> {
    const cliente = await this.buscar.porDocumento(cpfCnpj);
    return ClienteResponseDto.fromDomain(cliente);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza cliente' })
  async update(
    @Param('id') id: string,
    @Body() dto: AtualizarClienteDto,
  ): Promise<ClienteResponseDto> {
    const cliente = await this.atualizar.execute({ id, ...dto });
    return ClienteResponseDto.fromDomain(cliente);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove cliente' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.remover.execute(id);
  }
}
