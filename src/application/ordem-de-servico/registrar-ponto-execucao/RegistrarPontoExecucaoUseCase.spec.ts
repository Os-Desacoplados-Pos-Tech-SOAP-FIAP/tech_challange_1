import { NotFoundException } from '@nestjs/common';

import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { TipoItemOrcamento } from '../../../domain/ordem-de-servico/entities/ItemOrcamento';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { StatusOSEnum } from '../../../domain/ordem-de-servico/value-objects/StatusOS';
import { DomainError } from '../../../domain/shared/DomainError';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { RegistrarPontoExecucaoUseCase } from './RegistrarPontoExecucaoUseCase';

class InMemoryOSRepository implements IOrdemDeServicoRepository {
  public ordens: OrdemDeServico[] = [];
  async salvar(os: OrdemDeServico) {
    const i = this.ordens.findIndex((x) => x.id.equals(os.id));
    if (i >= 0) this.ordens[i] = os;
    else this.ordens.push(os);
  }
  async buscarPorId(id: UniqueID) {
    return this.ordens.find((o) => o.id.equals(id)) ?? null;
  }
  async buscarPorNumero(n: number) {
    return this.ordens.find((o) => o.numero.value === n) ?? null;
  }
  async buscarPorItemOrcamentoId(id: UniqueID) {
    return this.ordens.find((o) => o.itensOrcamento.some((i) => i.id.equals(id))) ?? null;
  }
  async listar() {
    return this.ordens;
  }
  async proximoNumero() {
    return this.ordens.length + 1;
  }
  async tempoMedioExecucaoMinutos() {
    return 0;
  }
  async tempoMedioExecucaoPorServico() {
    return [];
  }
}

describe('RegistrarPontoExecucaoUseCase', () => {
  let repo: InMemoryOSRepository;
  let useCase: RegistrarPontoExecucaoUseCase;
  let os: OrdemDeServico;
  let itemId: string;

  beforeEach(() => {
    repo = new InMemoryOSRepository();
    useCase = new RegistrarPontoExecucaoUseCase(repo);

    os = OrdemDeServico.criar({
      numero: 1,
      clienteId: new UniqueID().toValue(),
      veiculoId: new UniqueID().toValue(),
    });
    os.adicionarItem({
      tipo: TipoItemOrcamento.SERVICO,
      referenciaId: new UniqueID().toValue(),
      descricao: 'Alinhamento',
      quantidade: 1,
      valorUnitario: 100,
    });
    os.avancarStatus();
    os.aprovarOrcamento();
    itemId = os.itensOrcamento[0].id.toValue();
    repo.ordens.push(os);
  });

  it('1ª chamada registra início e leva OS para EM_EXECUCAO', async () => {
    const mecanicoId = new UniqueID().toValue();
    const result = await useCase.execute({ itemOrcamentoId: itemId, mecanicoId });
    expect(result.status.value).toBe(StatusOSEnum.EM_EXECUCAO);
    expect(result.execucoes).toHaveLength(1);
    expect(result.execucoes[0].mecanicoId.toValue()).toBe(mecanicoId);
    expect(result.execucoes[0].fim).toBeUndefined();
  });

  it('2ª chamada finaliza execução e leva OS para FINALIZADA', async () => {
    const mecanicoId = new UniqueID().toValue();
    await useCase.execute({ itemOrcamentoId: itemId, mecanicoId });
    const result = await useCase.execute({ itemOrcamentoId: itemId, mecanicoId });
    expect(result.execucoes[0].fim).toBeInstanceOf(Date);
    expect(result.status.value).toBe(StatusOSEnum.FINALIZADA);
  });

  it('lança NotFoundException para item inexistente', async () => {
    await expect(
      useCase.execute({
        itemOrcamentoId: new UniqueID().toValue(),
        mecanicoId: new UniqueID().toValue(),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('3ª chamada lança DomainError (já finalizada)', async () => {
    const mecanicoId = new UniqueID().toValue();
    await useCase.execute({ itemOrcamentoId: itemId, mecanicoId });
    await useCase.execute({ itemOrcamentoId: itemId, mecanicoId });
    await expect(useCase.execute({ itemOrcamentoId: itemId, mecanicoId })).rejects.toThrow(
      DomainError,
    );
  });
});
