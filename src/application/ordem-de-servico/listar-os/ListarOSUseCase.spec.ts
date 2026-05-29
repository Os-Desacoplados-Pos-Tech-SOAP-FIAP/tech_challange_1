import { UniqueID } from '../../../domain/shared/UniqueID';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { NumeroOS } from '../../../domain/ordem-de-servico/value-objects/NumeroOS';
import { StatusOS } from '../../../domain/ordem-de-servico/value-objects/StatusOS';
import { StatusOSEnum } from '../../../domain/ordem-de-servico/value-objects/StatusOSEnum';
import { ListarOSUseCase } from './ListarOSUseCase';

class InMemoryOSRepository implements IOrdemDeServicoRepository {
  public ordens: OrdemDeServico[] = [];
  public tempoMedio = 60;
  async salvar(os: OrdemDeServico) { this.ordens.push(os); }
  async buscarPorId(id: UniqueID) { return this.ordens.find(o => o.id.equals(id)) ?? null; }
  async buscarPorNumero(n: number) { return this.ordens.find(o => o.numero.value === n) ?? null; }
  async buscarPorItemOrcamentoId(id: UniqueID) { return this.ordens.find(o => o.itensOrcamento.some(i => i.id.equals(id))) ?? null; }
  async listar() { return this.ordens; }
  async proximoNumero() { return this.ordens.length + 1; }
  async tempoMedioExecucaoMinutos() { return this.tempoMedio; }
  async tempoMedioExecucaoPorServico() { return []; }
}

function buildOS(numero: number, status: StatusOSEnum, criadoEm: Date): OrdemDeServico {
  return OrdemDeServico.restaurar(
    {
      numero: NumeroOS.create(numero),
      clienteId: new UniqueID(),
      veiculoId: new UniqueID(),
      status: StatusOS.create(status),
      itensOrcamento: [],
      execucoes: [],
      criadoEm,
    },
    new UniqueID(),
  );
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

  it('exclui logicamente OS finalizadas e entregues', async () => {
    const repo = new InMemoryOSRepository();
    repo.ordens.push(
      buildOS(1, StatusOSEnum.RECEBIDA, new Date('2024-01-01')),
      buildOS(2, StatusOSEnum.EM_EXECUCAO, new Date('2024-01-02')),
      buildOS(3, StatusOSEnum.FINALIZADA, new Date('2024-01-03')),
      buildOS(4, StatusOSEnum.ENTREGUE, new Date('2024-01-04')),
    );
    const useCase = new ListarOSUseCase(repo);
    const result = await useCase.execute();
    const statuses = result.map((o) => o.status.value);
    expect(result).toHaveLength(2);
    expect(statuses).not.toContain(StatusOSEnum.FINALIZADA);
    expect(statuses).not.toContain(StatusOSEnum.ENTREGUE);
  });

  it('ordena por peso de status (Em Execução > Aguardando Aprovação > Diagnóstico > Recebida)', async () => {
    const repo = new InMemoryOSRepository();
    const mesmaData = new Date('2024-01-01T10:00:00Z');
    repo.ordens.push(
      buildOS(1, StatusOSEnum.RECEBIDA, mesmaData),
      buildOS(2, StatusOSEnum.EM_DIAGNOSTICO, mesmaData),
      buildOS(3, StatusOSEnum.AGUARDANDO_APROVACAO, mesmaData),
      buildOS(4, StatusOSEnum.EM_EXECUCAO, mesmaData),
    );
    const useCase = new ListarOSUseCase(repo);
    const result = await useCase.execute();
    expect(result.map((o) => o.status.value)).toEqual([
      StatusOSEnum.EM_EXECUCAO,
      StatusOSEnum.AGUARDANDO_APROVACAO,
      StatusOSEnum.EM_DIAGNOSTICO,
      StatusOSEnum.RECEBIDA,
    ]);
  });

  it('desempata por criadoEm ASC dentro do mesmo status (mais antigas primeiro)', async () => {
    const repo = new InMemoryOSRepository();
    repo.ordens.push(
      buildOS(3, StatusOSEnum.RECEBIDA, new Date('2024-03-01')),
      buildOS(1, StatusOSEnum.RECEBIDA, new Date('2024-01-01')),
      buildOS(2, StatusOSEnum.RECEBIDA, new Date('2024-02-01')),
    );
    const useCase = new ListarOSUseCase(repo);
    const result = await useCase.execute();
    expect(result.map((o) => o.numero.value)).toEqual([1, 2, 3]);
  });
});
