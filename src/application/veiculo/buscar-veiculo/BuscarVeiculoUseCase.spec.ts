import { NotFoundException } from '@nestjs/common';

import { UniqueID } from '../../../domain/shared/UniqueID';
import { Veiculo } from '../../../domain/veiculo/entities/Veiculo';
import { IVeiculoRepository } from '../../../domain/veiculo/repositories/IVeiculoRepository';
import { BuscarVeiculoUseCase } from './BuscarVeiculoUseCase';

class InMemoryVeiculoRepository implements IVeiculoRepository {
  public veiculos: Veiculo[] = [];
  async salvar(v: Veiculo) { this.veiculos.push(v); }
  async buscarPorId(id: UniqueID) { return this.veiculos.find(v => v.id.equals(id)) ?? null; }
  async buscarPorPlaca(placa: string) { return this.veiculos.find(v => v.placa.value === placa) ?? null; }
  async listar() { return this.veiculos; }
  async listarPorCliente(clienteId: UniqueID) { return this.veiculos.filter(v => v.clienteId.equals(clienteId)); }
  async remover(id: UniqueID) { this.veiculos = this.veiculos.filter(v => !v.id.equals(id)); }
}

describe('BuscarVeiculoUseCase', () => {
  let repo: InMemoryVeiculoRepository;
  let useCase: BuscarVeiculoUseCase;
  let veiculo: Veiculo;

  beforeEach(() => {
    repo = new InMemoryVeiculoRepository();
    useCase = new BuscarVeiculoUseCase(repo);
    veiculo = Veiculo.criar({ placa: 'ABC1234', marca: 'Toyota', modelo: 'Corolla', ano: 2020, clienteId: new UniqueID().toValue() });
    repo.veiculos.push(veiculo);
  });

  it('busca veículo por id', async () => {
    const result = await useCase.porId(veiculo.id.toValue());
    expect(result.id.equals(veiculo.id)).toBe(true);
  });

  it('lança NotFoundException por id inexistente', async () => {
    await expect(useCase.porId(new UniqueID().toValue())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('busca veículo por placa', async () => {
    const result = await useCase.porPlaca('ABC1234');
    expect(result.placa.value).toBe('ABC1234');
  });

  it('lança NotFoundException por placa inexistente', async () => {
    await expect(useCase.porPlaca('ZZZ0000')).rejects.toBeInstanceOf(NotFoundException);
  });
});
