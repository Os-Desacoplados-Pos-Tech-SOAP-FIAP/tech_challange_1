import { Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { ensureFound } from '../../../common/utils/ensure-found';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

interface FinalizarExecucaoInput {
  ordemDeServicoId: string;
  execucaoId: string;
  fim?: Date;
}

@Injectable()
export class FinalizarExecucaoUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
  ) {}

  async execute(input: FinalizarExecucaoInput): Promise<OrdemDeServico> {
    const os = ensureFound(
      await this.osRepository.buscarPorId(new UniqueID(input.ordemDeServicoId)),
      'OS',
    );
    os.finalizarExecucao(input.execucaoId, input.fim ?? new Date());
    await this.osRepository.salvar(os);
    return os;
  }
}
