import { Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { ensureFound } from '../../../common/utils/ensure-found';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

export interface RegistrarPontoExecucaoInput {
  itemOrcamentoId: string;
  mecanicoId: string;
}

@Injectable()
export class RegistrarPontoExecucaoUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
  ) {}

  async execute(input: RegistrarPontoExecucaoInput): Promise<OrdemDeServico> {
    const os = ensureFound(
      await this.osRepository.buscarPorItemOrcamentoId(new UniqueID(input.itemOrcamentoId)),
      'Item de orçamento',
    );

    os.registrarPontoExecucao(input.itemOrcamentoId, input.mecanicoId);
    await this.osRepository.salvar(os);
    return os;
  }
}
