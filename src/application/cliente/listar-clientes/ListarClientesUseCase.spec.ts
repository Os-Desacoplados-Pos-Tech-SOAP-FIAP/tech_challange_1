import { Cliente, TipoCliente } from '../../../domain/cliente/entities/Cliente';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { ListarClientesUseCase } from './ListarClientesUseCase';

class InMemoryClienteRepository implements IClienteRepository {
  public clientes: Cliente[] = [];
  async salvar(c: Cliente) { this.clientes.push(c); }
  async buscarPorId(id: UniqueID) { return this.clientes.find(c => c.id.equals(id)) ?? null; }
  async buscarPorDocumento() { return null; }
  async listar() { return this.clientes; }
  async remover(id: UniqueID) { this.clientes = this.clientes.filter(c => !c.id.equals(id)); }
}

describe('ListarClientesUseCase', () => {
  it('retorna lista vazia', async () => {
    const repo = new InMemoryClienteRepository();
    const useCase = new ListarClientesUseCase(repo);
    expect(await useCase.execute()).toHaveLength(0);
  });

  it('retorna clientes cadastrados', async () => {
    const repo = new InMemoryClienteRepository();
    const useCase = new ListarClientesUseCase(repo);
    repo.clientes.push(Cliente.criar({ tipo: TipoCliente.PF, documento: '529.982.247-25', nome: 'João', email: 'j@email.com' }));
    repo.clientes.push(Cliente.criar({ tipo: TipoCliente.PJ, documento: '11.222.333/0001-81', nome: 'Empresa', email: 'e@email.com' }));
    expect(await useCase.execute()).toHaveLength(2);
  });
});
