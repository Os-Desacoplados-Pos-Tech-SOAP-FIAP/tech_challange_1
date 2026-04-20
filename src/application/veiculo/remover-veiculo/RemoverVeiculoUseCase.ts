import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { IVeiculoRepository } from '../../../domain/veiculo/repositories/IVeiculoRepository';

@Injectable()
export class RemoverVeiculoUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.VEICULO_REPOSITORY)
    private readonly veiculoRepository: IVeiculoRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const veiculo = await this.veiculoRepository.buscarPorId(new UniqueID(id));
    if (!veiculo) throw new NotFoundException('Veículo não encontrado');
    await this.veiculoRepository.remover(new UniqueID(id));
  }
}
