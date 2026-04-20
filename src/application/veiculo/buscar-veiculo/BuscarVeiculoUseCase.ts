import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { Veiculo } from '../../../domain/veiculo/entities/Veiculo';
import { IVeiculoRepository } from '../../../domain/veiculo/repositories/IVeiculoRepository';

@Injectable()
export class BuscarVeiculoUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.VEICULO_REPOSITORY)
    private readonly veiculoRepository: IVeiculoRepository,
  ) {}

  async porId(id: string): Promise<Veiculo> {
    const veiculo = await this.veiculoRepository.buscarPorId(new UniqueID(id));
    if (!veiculo) throw new NotFoundException('Veículo não encontrado');
    return veiculo;
  }

  async porPlaca(placa: string): Promise<Veiculo> {
    const veiculo = await this.veiculoRepository.buscarPorPlaca(placa);
    if (!veiculo) throw new NotFoundException('Veículo não encontrado');
    return veiculo;
  }
}
