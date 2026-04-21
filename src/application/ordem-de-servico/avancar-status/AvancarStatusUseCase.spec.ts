import { NotFoundException } from '@nestjs/common';

import { DomainError } from '../../../domain/shared/DomainError';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { StatusOSEnum } from '../../../domain/ordem-de-servico/value-objects/StatusOS';
import { AvancarStatusUseCase } from './AvancarStatusUseCase';

class InMemoryOSRepository implements IOrdemDeServicoRepository {
  public ordens: OrdemDeServico[] = [];
  async salvar(os: OrdemDeServico) { const i = this.ordens.findIndex(x => x.id.equals(os.id)); if (i >= 0) this.ordens[i] = os; else this.ordens.push(os); }
  async buscarPorId(id: UniqueID) { return this.ordens.find(o => o.id.equals(id)) ?? null; }
  async buscarPorNumero(n: number) { return this.ordens.find(o => o.numero.value === n) ?? null; }
  async listar() { return this.ordens; }
  async proximoNumero() { return this.ordens.length + 1; }
  async tempoMedioExecucaoMinutos() { return 0; }
  async tempoMedioExecucaoPorServico() { return []; }
}

describe('AvancarStatusUseCase', () => {
  let repo: InMemoryOSRepository;
  let useCase: AvancarStatusUseCase;
  let os: OrdemDeServico;

  beforeEach(() => {
    repo = new InMemoryOSRepository();
    useCase = new AvancarStatusUseCase(repo);
    os = OrdemDeServico.criar({ numero: 1, clienteId: new UniqueID().toValue(), veiculoId: new UniqueID().toValue() });
    repo.ordens.push(os);
  });

  it('avança status de RECEBIDA para EM_DIAGNOSTICO', async () => {
    const result = await useCase.execute({ id: os.id.toValue(), novoStatus: StatusOSEnum.EM_DIAGNOSTICO });
    expect(result.status.value).toBe(StatusOSEnum.EM_DIAGNOSTICO);
  });

  it('lança NotFoundException para OS inexistente', async () => {
    await expect(useCase.execute({ id: new UniqueID().toValue(), novoStatus: StatusOSEnum.EM_DIAGNOSTICO }))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('lança DomainError para transição inválida', async () => {
    await expect(useCase.execute({ id: os.id.toValue(), novoStatus: StatusOSEnum.ENTREGUE }))
      .rejects.toThrow(DomainError);
  });
});
