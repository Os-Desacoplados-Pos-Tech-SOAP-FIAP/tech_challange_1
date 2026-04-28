import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { ensureFound } from '../../../common/utils/ensure-found';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrcamentoTokenRepository } from '../../../domain/ordem-de-servico/repositories/IOrcamentoTokenRepository';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { DomainError } from '../../../domain/shared/DomainError';
import { UniqueID } from '../../../domain/shared/UniqueID';

export interface DecidirOrcamentoInput {
  numero: number;
  token: string;
  decisao: 'APROVADA' | 'REPROVADA';
}

@Injectable()
export class DecidirOrcamentoUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
    @Inject(INJECTION_TOKENS.ORCAMENTO_TOKEN_REPOSITORY)
    private readonly tokenRepository: IOrcamentoTokenRepository,
  ) {}

  async execute(input: DecidirOrcamentoInput): Promise<OrdemDeServico> {
    const record = ensureFound(
      await this.tokenRepository.buscarPorToken(input.token),
      'Token de orçamento',
    );
    if (record.usado) {
      throw new ConflictException('Token já utilizado');
    }

    const os = ensureFound(
      await this.osRepository.buscarPorId(new UniqueID(record.ordemDeServicoId)),
      'OS',
    );

    if (os.numero.value !== input.numero) {
      throw new DomainError(
        'Token não corresponde à OS informada',
        'TOKEN_OS_INCOMPATIVEL',
      );
    }

    if (input.decisao === 'APROVADA') {
      os.aprovarOrcamento();
    } else {
      os.recusarOrcamento();
    }

    await this.osRepository.salvar(os);
    await this.tokenRepository.marcarComoUsado(record.id);
    return os;
  }
}
