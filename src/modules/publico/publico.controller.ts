import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ConsultarOrcamentoPublicoUseCase } from '../../application/ordem-de-servico/consultar-orcamento-publico/ConsultarOrcamentoPublicoUseCase';
import { ConsultarOSUseCase } from '../../application/ordem-de-servico/consultar-os/ConsultarOSUseCase';
import { DecidirOrcamentoUseCase } from '../../application/ordem-de-servico/decidir-orcamento/DecidirOrcamentoUseCase';
import { Public } from '../../common/decorators/public.decorator';
import { TipoItemOrcamento } from '../../domain/ordem-de-servico/entities/ItemOrcamento';
import { DecidirOrcamentoDto } from './dto/decidir-orcamento.dto';

@ApiTags('Público')
@Controller('publico')
export class PublicoController {
  constructor(
    private readonly consultarOS: ConsultarOSUseCase,
    private readonly consultarOrcamentoPublicoUseCase: ConsultarOrcamentoPublicoUseCase,
    private readonly decidirOrcamentoUseCase: DecidirOrcamentoUseCase,
  ) {}

  @Public()
  @Get('os/:numero/status')
  @ApiOperation({
    summary: 'Consulta status público de uma OS pelo número',
    description: 'Rota aberta; devolve apenas informações não-sensíveis sobre a OS.',
  })
  @ApiResponse({ status: 200, description: 'Status da OS retornado' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async status(@Param('numero', ParseIntPipe) numero: number) {
    const os = await this.consultarOS.porNumero(numero);
    return {
      numero: os.numero.value,
      status: os.status.value,
      valorEstimado: os.valorEstimado.value,
      atualizadoEm: os.atualizadoEm,
    };
  }

  @Public()
  @Get('os/:numero/orcamento')
  @ApiOperation({
    summary: 'Consulta orçamento para aprovação do cliente',
    description: 'Autenticação por token de uso único enviado por email.',
  })
  @ApiResponse({ status: 200, description: 'Orçamento retornado' })
  @ApiResponse({ status: 404, description: 'Token ou OS não encontrados' })
  @ApiResponse({ status: 409, description: 'Token já utilizado' })
  async orcamento(
    @Param('numero', ParseIntPipe) numero: number,
    @Query('token') token: string,
  ) {
    const os = await this.consultarOrcamentoPublicoUseCase.execute(numero, token);
    return {
      numero: os.numero.value,
      status: os.status.value,
      valorEstimado: os.valorEstimado.value,
      itens: os.itensOrcamento.map((i) => ({
        tipo: i.tipo === TipoItemOrcamento.SERVICO ? 'SERVICO' : 'INSUMO',
        descricao: i.descricao,
        quantidade: i.quantidade,
        valorUnitario: i.valorUnitario,
        valorTotal: i.valorTotal,
      })),
    };
  }

  @Public()
  @Post('os/:numero/orcamento/decisao')
  @ApiOperation({
    summary: 'Cliente aprova ou reprova orçamento com o token recebido',
    description: 'Token é invalidado após uso. Transição é feita com papel CLIENTE na máquina de estados.',
  })
  @ApiResponse({ status: 201, description: 'Decisão registrada' })
  @ApiResponse({ status: 404, description: 'Token ou OS não encontrados' })
  @ApiResponse({ status: 409, description: 'Token já utilizado' })
  @ApiResponse({ status: 422, description: 'Token não corresponde à OS ou transição inválida' })
  async decidir(
    @Param('numero', ParseIntPipe) numero: number,
    @Body() dto: DecidirOrcamentoDto,
  ) {
    const os = await this.decidirOrcamentoUseCase.execute({
      numero,
      token: dto.token,
      decisao: dto.decisao,
    });
    return {
      numero: os.numero.value,
      status: os.status.value,
    };
  }
}
