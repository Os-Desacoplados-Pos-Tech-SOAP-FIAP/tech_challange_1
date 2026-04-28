import { NotFoundException } from '@nestjs/common';

import { Cliente, TipoCliente } from '../../../domain/cliente/entities/Cliente';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { AtualizarClienteUseCase } from './AtualizarClienteUseCase';

class InMemoryClienteRepository implements IClienteRepository {
  public clientes: Cliente[] = [];
  async salvar(c: Cliente) { const idx = this.clientes.findIndex(x => x.id.equals(c.id)); if (idx >= 0) this.clientes[idx] = c; else this.clientes.push(c); }
  async buscarPorId(id: UniqueID) { return this.clientes.find(c => c.id.equals(id)) ?? null; }
  async buscarPorDocumento() { return null; }
  async listar() { return this.clientes; }
  async remover(id: UniqueID) { this.clientes = this.clientes.filter(c => !c.id.equals(id)); }
}

describe('AtualizarClienteUseCase', () => {
  let repo: InMemoryClienteRepository;
  let useCase: AtualizarClienteUseCase;
  let cliente: Cliente;

  beforeEach(() => {
    repo = new InMemoryClienteRepository();
    useCase = new AtualizarClienteUseCase(repo);
    cliente = Cliente.criar({ tipo: TipoCliente.PF, documento: '529.982.247-25', nome: 'João Silva', email: 'joao@email.com' });
    repo.clientes.push(cliente);
  });

  it('atualiza nome do cliente', async () => {
    const result = await useCase.execute({ id: cliente.id.toValue(), nome: 'João Atualizado' });
    expect(result.nome).toBe('João Atualizado');
  });

  it('atualiza email do cliente', async () => {
    const result = await useCase.execute({ id: cliente.id.toValue(), email: 'novo@email.com' });
    expect(result.email.value).toBe('novo@email.com');
  });

  it('lança NotFoundException para cliente inexistente', async () => {
    await expect(useCase.execute({ id: new UniqueID().toValue(), nome: 'X' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
