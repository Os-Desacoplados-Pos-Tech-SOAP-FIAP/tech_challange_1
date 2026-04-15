import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { Cliente } from '../../../domain/cliente/entities/Cliente';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

@Injectable()
export class BuscarClienteUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.CLIENTE_REPOSITORY)
    private readonly clienteRepository: IClienteRepository,
  ) {}

  async porId(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.buscarPorId(new UniqueID(id));
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async porDocumento(cpfCnpj: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.buscarPorDocumento(cpfCnpj);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }
}
