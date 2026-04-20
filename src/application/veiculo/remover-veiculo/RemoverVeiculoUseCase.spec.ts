import { NotFoundException } from '@nestjs/common';

import { UniqueID } from '../../../domain/shared/UniqueID';
import { Veiculo } from '../../../domain/veiculo/entities/Veiculo';
import { IVeiculoRepository } from '../../../domain/veiculo/repositories/IVeiculoRepository';
import { RemoverVeiculoUseCase } from './RemoverVeiculoUseCase';

class InMemoryVeiculoRepository implements IVeiculoRepository {
  public veiculos: Veiculo[] = [];
  async salvar(v: Veiculo) { this.veiculos.push(v); }
  async buscarPorId(id: UniqueID) { return this.veiculos.find(v => v.id.equals(id)) ?? null; }
  async buscarPorPlaca(placa: string) { return this.veiculos.find(v => v.placa.value === placa) ?? null; }
  async listar() { return this.veiculos; }
  async listarPorCliente(clienteId: UniqueID) { return this.veiculos.filter(v => v.clienteId.equals(clienteId)); }
  async remover(id: UniqueID) { this.veiculos = this.veiculos.filter(v => !v.id.equals(id)); }
}

describe('RemoverVeiculoUseCase', () => {
  let repo: InMemoryVeiculoRepository;
  let useCase: RemoverVeiculoUseCase;
  let veiculo: Veiculo;

  beforeEach(() => {
    repo = new InMemoryVeiculoRepository();
    useCase = new RemoverVeiculoUseCase(repo);
    veiculo = Veiculo.criar({ placa: 'ABC1234', marca: 'Toyota', modelo: 'Corolla', ano: 2020, clienteId: new UniqueID().toValue() });
    repo.veiculos.push(veiculo);
  });

  it('remove veículo existente', async () => {
    await useCase.execute(veiculo.id.toValue());
    expect(repo.veiculos).toHaveLength(0);
  });

  it('lança NotFoundException para veículo inexistente', async () => {
    await expect(useCase.execute(new UniqueID().toValue())).rejects.toBeInstanceOf(NotFoundException);
  });
});
