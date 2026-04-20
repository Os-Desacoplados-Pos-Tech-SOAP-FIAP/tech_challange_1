import { ApiProperty } from '@nestjs/swagger';

import { TempoMedioPorServicoOutput } from '../../../application/ordem-de-servico/tempo-medio-por-servico/TempoMedioPorServicoUseCase';

export class TempoMedioPorServicoResponseDto {
  @ApiProperty() servicoId!: string;
  @ApiProperty() nome!: string;
  @ApiProperty() tempoMedioMinutos!: number;
  @ApiProperty() totalExecucoes!: number;

  static fromOutput(out: TempoMedioPorServicoOutput): TempoMedioPorServicoResponseDto {
    return {
      servicoId: out.servicoId,
      nome: out.nome,
      tempoMedioMinutos: out.tempoMedioMinutos,
      totalExecucoes: out.totalExecucoes,
    };
  }
}
