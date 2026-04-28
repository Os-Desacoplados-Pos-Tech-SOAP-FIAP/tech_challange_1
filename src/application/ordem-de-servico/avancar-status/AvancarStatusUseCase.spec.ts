import { NotFoundException } from '@nestjs/common';

import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { TipoItemOrcamento } from '../../../domain/ordem-de-servico/entities/ItemOrcamento';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { StatusOSEnum } from '../../../domain/ordem-de-servico/value-objects/StatusOS';
import { DomainError } from '../../../domain/shared/DomainError';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { AvancarStatusUseCase } from './AvancarStatusUseCase';

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

describe('AvancarStatusUseCase', () => {
  let repo: InMemoryOSRepository;
  let useCase: AvancarStatusUseCase;

  beforeEach(() => {
    repo = new InMemoryOSRepository();
    useCase = new AvancarStatusUseCase(repo);
  });

  it('avança EM_DIAGNOSTICO → AGUARDANDO_APROVACAO quando há item', async () => {
    const os = OrdemDeServico.criar({
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
    repo.ordens.push(os);
    const result = await useCase.execute({ id: os.id.toValue() });
    expect(result.status.value).toBe(StatusOSEnum.AGUARDANDO_APROVACAO);
  });

  it('lança NotFoundException para OS inexistente', async () => {
    await expect(useCase.execute({ id: new UniqueID().toValue() })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lança DomainError quando não há avanço manual disponível (RECEBIDA)', async () => {
    const os = OrdemDeServico.criar({
      numero: 1,
      clienteId: new UniqueID().toValue(),
      veiculoId: new UniqueID().toValue(),
    });
    repo.ordens.push(os);
    await expect(useCase.execute({ id: os.id.toValue() })).rejects.toThrow(DomainError);
  });
});
