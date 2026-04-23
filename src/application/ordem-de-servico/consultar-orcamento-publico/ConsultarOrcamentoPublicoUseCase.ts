import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { ensureFound } from '../../../common/utils/ensure-found';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrcamentoTokenRepository } from '../../../domain/ordem-de-servico/repositories/IOrcamentoTokenRepository';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { DomainError } from '../../../domain/shared/DomainError';
import { UniqueID } from '../../../domain/shared/UniqueID';

@Injectable()
export class ConsultarOrcamentoPublicoUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
    @Inject(INJECTION_TOKENS.ORCAMENTO_TOKEN_REPOSITORY)
    private readonly tokenRepository: IOrcamentoTokenRepository,
  ) {}

  async execute(numero: number, token: string): Promise<OrdemDeServico> {
    const record = ensureFound(
      await this.tokenRepository.buscarPorToken(token),
      'Token de orçamento',
    );
    if (record.usado) {
      throw new ConflictException('Token já utilizado');
    }
    const os = ensureFound(
      await this.osRepository.buscarPorId(new UniqueID(record.ordemDeServicoId)),
      'OS',
    );
    if (os.numero.value !== numero) {
      throw new DomainError(
        'Token não corresponde à OS informada',
        'TOKEN_OS_INCOMPATIVEL',
      );
    }
    return os;
  }
}
