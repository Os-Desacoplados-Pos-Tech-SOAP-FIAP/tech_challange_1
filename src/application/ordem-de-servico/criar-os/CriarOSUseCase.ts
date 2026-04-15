import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { NovoItemOrcamentoInput } from '../../../domain/ordem-de-servico/entities/ItemOrcamento';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { IVeiculoRepository } from '../../../domain/veiculo/repositories/IVeiculoRepository';

export interface CriarOSInput {
  clienteId: string;
  veiculoId: string;
  observacoes?: string;
  itensIniciais?: NovoItemOrcamentoInput[];
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
    const cliente = await this.clienteRepository.buscarPorId(new UniqueID(input.clienteId));
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    const veiculo = await this.veiculoRepository.buscarPorId(new UniqueID(input.veiculoId));
    if (!veiculo) throw new NotFoundException('Veículo não encontrado');

    const numero = await this.osRepository.proximoNumero();
    const os = OrdemDeServico.criar({
      numero,
      clienteId: input.clienteId,
      veiculoId: input.veiculoId,
      observacoes: input.observacoes,
      itensIniciais: input.itensIniciais,
    });

    await this.osRepository.salvar(os);
    return os;
  }
}
