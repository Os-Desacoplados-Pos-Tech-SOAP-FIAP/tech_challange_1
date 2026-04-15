import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { Cliente } from '../../../domain/cliente/entities/Cliente';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

interface AtualizarClienteInput {
  id: string;
  nome?: string;
  email?: string;
  telefone?: string;
}

@Injectable()
export class AtualizarClienteUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.CLIENTE_REPOSITORY)
    private readonly clienteRepository: IClienteRepository,
  ) {}

  async execute(input: AtualizarClienteInput): Promise<Cliente> {
    const cliente = await this.clienteRepository.buscarPorId(new UniqueID(input.id));
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    cliente.atualizar({ nome: input.nome, email: input.email, telefone: input.telefone });
    await this.clienteRepository.salvar(cliente);
    return cliente;
  }
}
