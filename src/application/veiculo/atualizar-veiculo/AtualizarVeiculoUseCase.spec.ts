import { NotFoundException } from '@nestjs/common';

import { UniqueID } from '../../../domain/shared/UniqueID';
import { Veiculo } from '../../../domain/veiculo/entities/Veiculo';
import { IVeiculoRepository } from '../../../domain/veiculo/repositories/IVeiculoRepository';
import { AtualizarVeiculoUseCase } from './AtualizarVeiculoUseCase';

class InMemoryVeiculoRepository implements IVeiculoRepository {
  public veiculos: Veiculo[] = [];
  async salvar(v: Veiculo) { const i = this.veiculos.findIndex(x => x.id.equals(v.id)); if (i >= 0) this.veiculos[i] = v; else this.veiculos.push(v); }
  async buscarPorId(id: UniqueID) { return this.veiculos.find(v => v.id.equals(id)) ?? null; }
  async buscarPorPlaca(placa: string) { return this.veiculos.find(v => v.placa.value === placa) ?? null; }
  async listar() { return this.veiculos; }
  async listarPorCliente(clienteId: UniqueID) { return this.veiculos.filter(v => v.clienteId.equals(clienteId)); }
  async remover(id: UniqueID) { this.veiculos = this.veiculos.filter(v => !v.id.equals(id)); }
}

describe('AtualizarVeiculoUseCase', () => {
  let repo: InMemoryVeiculoRepository;
  let useCase: AtualizarVeiculoUseCase;
  let veiculo: Veiculo;

  beforeEach(() => {
    repo = new InMemoryVeiculoRepository();
    useCase = new AtualizarVeiculoUseCase(repo);
    veiculo = Veiculo.criar({ placa: 'ABC1234', marca: 'Toyota', modelo: 'Corolla', ano: 2020, clienteId: new UniqueID().toValue() });
    repo.veiculos.push(veiculo);
  });

  it('atualiza placa e ano', async () => {
    const result = await useCase.execute({ id: veiculo.id.toValue(), placa: 'XYZ9876', ano: 2022 });
    expect(result.placa.value).toBe('XYZ9876');
    expect(result.ano.value).toBe(2022);
  });

  it('lança NotFoundException para veículo inexistente', async () => {
    await expect(useCase.execute({ id: new UniqueID().toValue() })).rejects.toBeInstanceOf(NotFoundException);
  });
});
