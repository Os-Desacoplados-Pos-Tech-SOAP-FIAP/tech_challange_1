import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

@Injectable()
export class AprovarOrcamentoUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
  ) {}

  async execute(id: string): Promise<OrdemDeServico> {
    const os = await this.osRepository.buscarPorId(new UniqueID(id));
    if (!os) throw new NotFoundException('OS não encontrada');
    os.aprovarOrcamento();
    await this.osRepository.salvar(os);
    return os;
  }
}
