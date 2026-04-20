import { UniqueID } from '../../../domain/shared/UniqueID';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { ListarOSUseCase } from './ListarOSUseCase';

class InMemoryOSRepository implements IOrdemDeServicoRepository {
  public ordens: OrdemDeServico[] = [];
  public tempoMedio = 60;
  async salvar(os: OrdemDeServico) { this.ordens.push(os); }
  async buscarPorId(id: UniqueID) { return this.ordens.find(o => o.id.equals(id)) ?? null; }
  async buscarPorNumero(n: number) { return this.ordens.find(o => o.numero.value === n) ?? null; }
  async listar() { return this.ordens; }
  async proximoNumero() { return this.ordens.length + 1; }
  async tempoMedioExecucaoMinutos() { return this.tempoMedio; }
  async tempoMedioExecucaoPorServico() { return []; }
}

describe('ListarOSUseCase', () => {
  it('retorna lista vazia', async () => {
    const repo = new InMemoryOSRepository();
    const useCase = new ListarOSUseCase(repo);
    expect(await useCase.execute()).toHaveLength(0);
  });

  it('retorna OS cadastradas', async () => {
    const repo = new InMemoryOSRepository();
    repo.ordens.push(OrdemDeServico.criar({ numero: 1, clienteId: new UniqueID().toValue(), veiculoId: new UniqueID().toValue() }));
    repo.ordens.push(OrdemDeServico.criar({ numero: 2, clienteId: new UniqueID().toValue(), veiculoId: new UniqueID().toValue() }));
    const useCase = new ListarOSUseCase(repo);
    expect(await useCase.execute()).toHaveLength(2);
  });

  it('retorna tempo médio de execução', async () => {
    const repo = new InMemoryOSRepository();
    repo.tempoMedio = 90;
    const useCase = new ListarOSUseCase(repo);
    expect(await useCase.tempoMedioExecucao()).toBe(90);
  });
});
