import { ConflictException, NotFoundException } from '@nestjs/common';

import { Cliente, TipoCliente } from '../../../domain/cliente/entities/Cliente';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { Veiculo } from '../../../domain/veiculo/entities/Veiculo';
import { IVeiculoRepository } from '../../../domain/veiculo/repositories/IVeiculoRepository';
import { CadastrarVeiculoUseCase } from './CadastrarVeiculoUseCase';

class InMemoryVeiculoRepository implements IVeiculoRepository {
  public veiculos: Veiculo[] = [];
  async salvar(v: Veiculo) { this.veiculos.push(v); }
  async buscarPorId(id: UniqueID) { return this.veiculos.find(v => v.id.equals(id)) ?? null; }
  async buscarPorPlaca(placa: string) { return this.veiculos.find(v => v.placa.value === placa) ?? null; }
  async listar() { return this.veiculos; }
  async listarPorCliente(clienteId: UniqueID) { return this.veiculos.filter(v => v.clienteId.equals(clienteId)); }
  async remover(id: UniqueID) { this.veiculos = this.veiculos.filter(v => !v.id.equals(id)); }
}

class InMemoryClienteRepository implements IClienteRepository {
  public clientes: Cliente[] = [];
  async salvar(c: Cliente) { this.clientes.push(c); }
  async buscarPorId(id: UniqueID) { return this.clientes.find(c => c.id.equals(id)) ?? null; }
  async buscarPorDocumento() { return null; }
  async listar() { return this.clientes; }
  async remover(id: UniqueID) { this.clientes = this.clientes.filter(c => !c.id.equals(id)); }
}

describe('CadastrarVeiculoUseCase', () => {
  let veiculoRepo: InMemoryVeiculoRepository;
  let clienteRepo: InMemoryClienteRepository;
  let useCase: CadastrarVeiculoUseCase;
  let cliente: Cliente;

  beforeEach(() => {
    veiculoRepo = new InMemoryVeiculoRepository();
    clienteRepo = new InMemoryClienteRepository();
    useCase = new CadastrarVeiculoUseCase(veiculoRepo, clienteRepo);
    cliente = Cliente.criar({ tipo: TipoCliente.PF, cpfCnpj: '529.982.247-25', nome: 'João Silva', email: 'joao@email.com' });
    clienteRepo.clientes.push(cliente);
  });

  it('cadastra veículo válido', async () => {
    const v = await useCase.execute({ placa: 'ABC1234', marca: 'Toyota', modelo: 'Corolla', ano: 2020, clienteId: cliente.id.toValue() });
    expect(v.placa.value).toBe('ABC1234');
    expect(veiculoRepo.veiculos).toHaveLength(1);
  });

  it('lança NotFoundException para cliente inexistente', async () => {
    await expect(useCase.execute({ placa: 'ABC1234', marca: 'Toyota', modelo: 'Corolla', ano: 2020, clienteId: new UniqueID().toValue() }))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('lança ConflictException para placa duplicada', async () => {
    await useCase.execute({ placa: 'ABC1234', marca: 'Toyota', modelo: 'Corolla', ano: 2020, clienteId: cliente.id.toValue() });
    await expect(useCase.execute({ placa: 'ABC1234', marca: 'Honda', modelo: 'Civic', ano: 2021, clienteId: cliente.id.toValue() }))
      .rejects.toBeInstanceOf(ConflictException);
  });
});
