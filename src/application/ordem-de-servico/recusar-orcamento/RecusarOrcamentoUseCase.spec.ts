import { NotFoundException } from '@nestjs/common';

import { UniqueID } from '../../../domain/shared/UniqueID';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { StatusOSEnum } from '../../../domain/ordem-de-servico/value-objects/StatusOS';
import { RecusarOrcamentoUseCase } from './RecusarOrcamentoUseCase';

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

const makeOSAguardando = () => {
  const os = OrdemDeServico.criar({ numero: 1, clienteId: new UniqueID().toValue(), veiculoId: new UniqueID().toValue() });
  os.transicionarPara(StatusOSEnum.EM_DIAGNOSTICO);
  os.transicionarPara(StatusOSEnum.AGUARDANDO_APROVACAO);
  return os;
};

describe('RecusarOrcamentoUseCase', () => {
  let repo: InMemoryOSRepository;
  let useCase: RecusarOrcamentoUseCase;

  beforeEach(() => {
    repo = new InMemoryOSRepository();
    useCase = new RecusarOrcamentoUseCase(repo);
  });

  it('recusa TOTAL e cancela OS', async () => {
    const os = makeOSAguardando();
    repo.ordens.push(os);
    const result = await useCase.execute({ id: os.id.toValue(), motivo: 'TOTAL' });
    expect(result.status.value).toBe(StatusOSEnum.CANCELADA);
  });

  it('recusa PARCIAL e volta para EM_DIAGNOSTICO', async () => {
    const os = makeOSAguardando();
    repo.ordens.push(os);
    const result = await useCase.execute({ id: os.id.toValue(), motivo: 'PARCIAL' });
    expect(result.status.value).toBe(StatusOSEnum.EM_DIAGNOSTICO);
  });

  it('lança NotFoundException para OS inexistente', async () => {
    await expect(useCase.execute({ id: new UniqueID().toValue(), motivo: 'TOTAL' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
