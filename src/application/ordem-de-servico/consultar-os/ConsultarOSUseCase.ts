import { Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { ensureFound } from '../../../common/utils/ensure-found';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

@Injectable()
export class ConsultarOSUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
  ) {}

  async porId(id: string): Promise<OrdemDeServico> {
    return ensureFound(await this.osRepository.buscarPorId(new UniqueID(id)), 'OS');
  }

  async porNumero(numero: number): Promise<OrdemDeServico> {
    return ensureFound(await this.osRepository.buscarPorNumero(numero), 'OS');
  }
}
