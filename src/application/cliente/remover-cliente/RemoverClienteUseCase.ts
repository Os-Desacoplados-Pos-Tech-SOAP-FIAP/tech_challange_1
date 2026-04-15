import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

@Injectable()
export class RemoverClienteUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.CLIENTE_REPOSITORY)
    private readonly clienteRepository: IClienteRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const cliente = await this.clienteRepository.buscarPorId(new UniqueID(id));
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    await this.clienteRepository.remover(new UniqueID(id));
  }
}
