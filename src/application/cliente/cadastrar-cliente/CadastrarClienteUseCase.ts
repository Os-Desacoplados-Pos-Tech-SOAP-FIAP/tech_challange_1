import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { Cliente, NovoClienteInput } from '../../../domain/cliente/entities/Cliente';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';

@Injectable()
export class CadastrarClienteUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.CLIENTE_REPOSITORY)
    private readonly clienteRepository: IClienteRepository,
  ) {}

  async execute(input: NovoClienteInput): Promise<Cliente> {
    const cliente = Cliente.criar(input);
    const existente = await this.clienteRepository.buscarPorDocumento(cliente.cpfCnpj.value);
    if (existente) {
      throw new ConflictException('Já existe cliente cadastrado com este documento');
    }
    await this.clienteRepository.salvar(cliente);
    return cliente;
  }
}
