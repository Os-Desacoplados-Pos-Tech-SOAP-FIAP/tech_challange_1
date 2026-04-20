import { NotFoundException } from '@nestjs/common';

import { Cliente, TipoCliente } from '../../../domain/cliente/entities/Cliente';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { RemoverClienteUseCase } from './RemoverClienteUseCase';

class InMemoryClienteRepository implements IClienteRepository {
  public clientes: Cliente[] = [];
  async salvar(c: Cliente) { this.clientes.push(c); }
  async buscarPorId(id: UniqueID) { return this.clientes.find(c => c.id.equals(id)) ?? null; }
  async buscarPorDocumento() { return null; }
  async listar() { return this.clientes; }
  async remover(id: UniqueID) { this.clientes = this.clientes.filter(c => !c.id.equals(id)); }
}

describe('RemoverClienteUseCase', () => {
  let repo: InMemoryClienteRepository;
  let useCase: RemoverClienteUseCase;
  let cliente: Cliente;

  beforeEach(() => {
    repo = new InMemoryClienteRepository();
    useCase = new RemoverClienteUseCase(repo);
    cliente = Cliente.criar({ tipo: TipoCliente.PF, cpfCnpj: '529.982.247-25', nome: 'João Silva', email: 'joao@email.com' });
    repo.clientes.push(cliente);
  });

  it('remove cliente existente', async () => {
    await useCase.execute(cliente.id.toValue());
    expect(repo.clientes).toHaveLength(0);
  });

  it('lança NotFoundException para cliente inexistente', async () => {
    await expect(useCase.execute(new UniqueID().toValue())).rejects.toBeInstanceOf(NotFoundException);
  });
});
