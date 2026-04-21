import { UniqueID } from '../../../domain/shared/UniqueID';
import { Veiculo } from '../../../domain/veiculo/entities/Veiculo';
import { IVeiculoRepository } from '../../../domain/veiculo/repositories/IVeiculoRepository';
import { ListarVeiculosUseCase } from './ListarVeiculosUseCase';

class InMemoryVeiculoRepository implements IVeiculoRepository {
  public veiculos: Veiculo[] = [];
  async salvar(v: Veiculo) { this.veiculos.push(v); }
  async buscarPorId(id: UniqueID) { return this.veiculos.find(v => v.id.equals(id)) ?? null; }
  async buscarPorPlaca(placa: string) { return this.veiculos.find(v => v.placa.value === placa) ?? null; }
  async listar() { return this.veiculos; }
  async listarPorCliente(clienteId: UniqueID) { return this.veiculos.filter(v => v.clienteId.equals(clienteId)); }
  async remover(id: UniqueID) { this.veiculos = this.veiculos.filter(v => !v.id.equals(id)); }
}

describe('ListarVeiculosUseCase', () => {
  let repo: InMemoryVeiculoRepository;
  let useCase: ListarVeiculosUseCase;
  let clienteId: UniqueID;

  beforeEach(() => {
    repo = new InMemoryVeiculoRepository();
    useCase = new ListarVeiculosUseCase(repo);
    clienteId = new UniqueID();
    repo.veiculos.push(Veiculo.criar({ placa: 'ABC1234', marca: 'Toyota', modelo: 'Corolla', ano: 2020, clienteId: clienteId.toValue() }));
    repo.veiculos.push(Veiculo.criar({ placa: 'XYZ9876', marca: 'Honda', modelo: 'Civic', ano: 2021, clienteId: new UniqueID().toValue() }));
  });

  it('lista todos os veículos', async () => {
    expect(await useCase.execute()).toHaveLength(2);
  });

  it('lista veículos por cliente', async () => {
    const result = await useCase.execute(clienteId.toValue());
    expect(result).toHaveLength(1);
    expect(result[0].placa.value).toBe('ABC1234');
  });
});
