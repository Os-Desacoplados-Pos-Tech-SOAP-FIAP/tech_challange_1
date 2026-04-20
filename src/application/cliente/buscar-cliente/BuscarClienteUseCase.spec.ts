import { NotFoundException } from '@nestjs/common';

import { Cliente, TipoCliente } from '../../../domain/cliente/entities/Cliente';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { BuscarClienteUseCase } from './BuscarClienteUseCase';

class InMemoryClienteRepository implements IClienteRepository {
  public clientes: Cliente[] = [];
  async salvar(c: Cliente) { this.clientes.push(c); }
  async buscarPorId(id: UniqueID) { return this.clientes.find(c => c.id.equals(id)) ?? null; }
  async buscarPorDocumento(doc: string) { return this.clientes.find(c => c.cpfCnpj.value === doc.replace(/\D/g, '')) ?? null; }
  async listar() { return this.clientes; }
  async remover(id: UniqueID) { this.clientes = this.clientes.filter(c => !c.id.equals(id)); }
}

describe('BuscarClienteUseCase', () => {
  let repo: InMemoryClienteRepository;
  let useCase: BuscarClienteUseCase;
  let cliente: Cliente;

  beforeEach(() => {
    repo = new InMemoryClienteRepository();
    useCase = new BuscarClienteUseCase(repo);
    cliente = Cliente.criar({ tipo: TipoCliente.PF, cpfCnpj: '529.982.247-25', nome: 'João Silva', email: 'joao@email.com' });
    repo.clientes.push(cliente);
  });

  it('busca cliente por id', async () => {
    const result = await useCase.porId(cliente.id.toValue());
    expect(result.id.equals(cliente.id)).toBe(true);
  });

  it('lança NotFoundException por id inexistente', async () => {
    await expect(useCase.porId(new UniqueID().toValue())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('busca cliente por documento', async () => {
    const result = await useCase.porDocumento('52998224725');
    expect(result.nome).toBe('João Silva');
  });

  it('lança NotFoundException por documento inexistente', async () => {
    await expect(useCase.porDocumento('00000000000')).rejects.toBeInstanceOf(NotFoundException);
  });
});
