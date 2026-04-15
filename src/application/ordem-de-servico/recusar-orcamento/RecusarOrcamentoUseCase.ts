import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

interface RecusarOrcamentoInput {
  id: string;
  motivo: 'TOTAL' | 'PARCIAL';
}

@Injectable()
export class RecusarOrcamentoUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
  ) {}

  async execute(input: RecusarOrcamentoInput): Promise<OrdemDeServico> {
    const os = await this.osRepository.buscarPorId(new UniqueID(input.id));
    if (!os) throw new NotFoundException('OS não encontrada');
    os.recusarOrcamento(input.motivo);
    await this.osRepository.salvar(os);
    return os;
  }
}
