import { ConflictException } from '@nestjs/common';

import { Cliente, TipoCliente } from '../../../domain/cliente/entities/Cliente';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { CadastrarClienteUseCase } from './CadastrarClienteUseCase';

class InMemoryClienteRepository implements IClienteRepository {
  public clientes: Cliente[] = [];

  async salvar(cliente: Cliente): Promise<void> {
    this.clientes.push(cliente);
  }
  async buscarPorId(id: UniqueID): Promise<Cliente | null> {
    return this.clientes.find((c) => c.id.equals(id)) ?? null;
  }
  async buscarPorDocumento(cpfCnpj: string): Promise<Cliente | null> {
    return this.clientes.find((c) => c.cpfCnpj.value === cpfCnpj.replace(/\D/g, '')) ?? null;
  }
  async listar(): Promise<Cliente[]> {
    return this.clientes;
  }
  async remover(id: UniqueID): Promise<void> {
    this.clientes = this.clientes.filter((c) => !c.id.equals(id));
  }
}

describe('CadastrarClienteUseCase', () => {
  let repo: InMemoryClienteRepository;
  let useCase: CadastrarClienteUseCase;

  beforeEach(() => {
    repo = new InMemoryClienteRepository();
    useCase = new CadastrarClienteUseCase(repo);
  });

  it('cadastra cliente PF válido', async () => {
    const cliente = await useCase.execute({
      tipo: TipoCliente.PF,
      cpfCnpj: '529.982.247-25',
      nome: 'João Silva',
      email: 'joao@email.com',
    });
    expect(cliente.nome).toBe('João Silva');
    expect(repo.clientes).toHaveLength(1);
  });

  it('recusa documento duplicado', async () => {
    await useCase.execute({
      tipo: TipoCliente.PF,
      cpfCnpj: '52998224725',
      nome: 'João Silva',
      email: 'joao@email.com',
    });
    await expect(
      useCase.execute({
        tipo: TipoCliente.PF,
        cpfCnpj: '52998224725',
        nome: 'Outra Pessoa',
        email: 'outra@email.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
