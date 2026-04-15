import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { StatusOSEnum } from '../../../domain/ordem-de-servico/value-objects/StatusOS';
import { UniqueID } from '../../../domain/shared/UniqueID';

interface AvancarStatusInput {
  id: string;
  novoStatus: StatusOSEnum;
}

@Injectable()
export class AvancarStatusUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
  ) {}

  async execute(input: AvancarStatusInput): Promise<OrdemDeServico> {
    const os = await this.osRepository.buscarPorId(new UniqueID(input.id));
    if (!os) throw new NotFoundException('OS não encontrada');
    os.transicionarPara(input.novoStatus);
    await this.osRepository.salvar(os);
    return os;
  }
}
