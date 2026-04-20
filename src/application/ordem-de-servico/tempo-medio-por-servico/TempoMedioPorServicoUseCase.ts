import { Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { IServicoRepository } from '../../../domain/servico/repositories/IServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

export interface TempoMedioPorServicoOutput {
  servicoId: string;
  nome: string;
  tempoMedioMinutos: number;
  totalExecucoes: number;
}

@Injectable()
export class TempoMedioPorServicoUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
    @Inject(INJECTION_TOKENS.SERVICO_REPOSITORY)
    private readonly servicoRepository: IServicoRepository,
  ) {}

  async execute(): Promise<TempoMedioPorServicoOutput[]> {
    const rows = await this.osRepository.tempoMedioExecucaoPorServico();
    const output: TempoMedioPorServicoOutput[] = [];
    for (const row of rows) {
      const servico = await this.servicoRepository.buscarPorId(new UniqueID(row.servicoId));
      if (!servico) continue;
      output.push({
        servicoId: row.servicoId,
        nome: servico.nome,
        tempoMedioMinutos: row.tempoMedioMinutos,
        totalExecucoes: row.totalExecucoes,
      });
    }
    return output;
  }
}
