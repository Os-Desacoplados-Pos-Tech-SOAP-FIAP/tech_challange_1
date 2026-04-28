import { Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { ensureFound } from '../../../common/utils/ensure-found';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { DomainError } from '../../../domain/shared/DomainError';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { IVeiculoRepository } from '../../../domain/veiculo/repositories/IVeiculoRepository';

export interface CriarOSInput {
  clienteId: string;
  veiculoId: string;
  observacoes?: string;
}

@Injectable()
export class CriarOSUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
    @Inject(INJECTION_TOKENS.CLIENTE_REPOSITORY)
    private readonly clienteRepository: IClienteRepository,
    @Inject(INJECTION_TOKENS.VEICULO_REPOSITORY)
    private readonly veiculoRepository: IVeiculoRepository,
  ) {}

  async execute(input: CriarOSInput): Promise<OrdemDeServico> {
    ensureFound(
      await this.clienteRepository.buscarPorId(new UniqueID(input.clienteId)),
      'Cliente',
    );
    const veiculo = ensureFound(
      await this.veiculoRepository.buscarPorId(new UniqueID(input.veiculoId)),
      'Veículo',
    );

    if (veiculo.clienteId.toValue() !== input.clienteId) {
      throw new DomainError(
        'Veículo informado não pertence ao cliente',
        'VEICULO_NAO_PERTENCE_AO_CLIENTE',
      );
    }

    const numero = await this.osRepository.proximoNumero();
    const os = OrdemDeServico.criar({
      numero,
      clienteId: input.clienteId,
      veiculoId: input.veiculoId,
      observacoes: input.observacoes,
    });

    await this.osRepository.salvar(os);
    return os;
  }
}
