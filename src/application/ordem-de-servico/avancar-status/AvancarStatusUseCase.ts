import { Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { ensureFound } from '../../../common/utils/ensure-found';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { PerfilSolicitante } from '../../../domain/ordem-de-servico/state-machine/OsStateMachine';
import { StatusOSEnum } from '../../../domain/ordem-de-servico/value-objects/StatusOS';
import { UniqueID } from '../../../domain/shared/UniqueID';

interface AvancarStatusInput {
  id: string;
  novoStatus: StatusOSEnum;
  perfilSolicitante?: PerfilSolicitante;
}

@Injectable()
export class AvancarStatusUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
  ) {}

  async execute(input: AvancarStatusInput): Promise<OrdemDeServico> {
    const os = ensureFound(await this.osRepository.buscarPorId(new UniqueID(input.id)), 'OS');
    os.transicionarPara(input.novoStatus, input.perfilSolicitante);
    await this.osRepository.salvar(os);
    return os;
  }
}
