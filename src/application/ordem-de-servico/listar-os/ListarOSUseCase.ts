import { Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';

@Injectable()
export class ListarOSUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
  ) {}

  async execute(): Promise<OrdemDeServico[]> {
    return this.osRepository.listar();
  }

  async tempoMedioExecucao(): Promise<number> {
    return this.osRepository.tempoMedioExecucaoMinutos();
  }
}
