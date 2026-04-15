import { ApiProperty } from '@nestjs/swagger';

import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { StatusOSEnum } from '../../../domain/ordem-de-servico/value-objects/StatusOS';

export class OSItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tipo!: string;
  @ApiProperty() referenciaId!: string;
  @ApiProperty() descricao!: string;
  @ApiProperty() quantidade!: number;
  @ApiProperty() valorUnitario!: number;
  @ApiProperty() valorTotal!: number;
}

export class OSExecucaoResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() servicoId!: string;
  @ApiProperty() mecanicoId!: string;
  @ApiProperty() inicio!: Date;
  @ApiProperty({ required: false }) fim?: Date;
  @ApiProperty({ required: false }) tempoExecucaoMinutos?: number;
  @ApiProperty({ required: false }) observacoes?: string;
}

export class OSResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() numero!: number;
  @ApiProperty() clienteId!: string;
  @ApiProperty() veiculoId!: string;
  @ApiProperty({ enum: StatusOSEnum }) status!: StatusOSEnum;
  @ApiProperty() valorEstimado!: number;
  @ApiProperty({ required: false }) observacoes?: string;
  @ApiProperty({ type: [OSItemResponseDto] }) itensOrcamento!: OSItemResponseDto[];
  @ApiProperty({ type: [OSExecucaoResponseDto] }) execucoes!: OSExecucaoResponseDto[];
  @ApiProperty() criadoEm!: Date;
  @ApiProperty() atualizadoEm!: Date;

  static fromDomain(os: OrdemDeServico): OSResponseDto {
    return {
      id: os.id.toValue(),
      numero: os.numero.value,
      clienteId: os.clienteId.toValue(),
      veiculoId: os.veiculoId.toValue(),
      status: os.status.value,
      valorEstimado: os.valorEstimado.value,
      observacoes: os.observacoes,
      itensOrcamento: os.itensOrcamento.map((i) => ({
        id: i.id.toValue(),
        tipo: i.tipo,
        referenciaId: i.referenciaId.toValue(),
        descricao: i.descricao,
        quantidade: i.quantidade,
        valorUnitario: i.valorUnitario,
        valorTotal: i.valorTotal,
      })),
      execucoes: os.execucoes.map((e) => ({
        id: e.id.toValue(),
        servicoId: e.servicoId.toValue(),
        mecanicoId: e.mecanicoId.toValue(),
        inicio: e.inicio,
        fim: e.fim,
        tempoExecucaoMinutos: e.tempoExecucaoMinutos,
        observacoes: e.observacoes,
      })),
      criadoEm: os.criadoEm,
      atualizadoEm: os.atualizadoEm,
    };
  }
}
