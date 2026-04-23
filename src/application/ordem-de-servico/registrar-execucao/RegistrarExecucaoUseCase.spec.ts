import { NotFoundException } from '@nestjs/common';

import { UniqueID } from '../../../domain/shared/UniqueID';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { StatusOSEnum } from '../../../domain/ordem-de-servico/value-objects/StatusOS';
import { RegistrarExecucaoUseCase } from './RegistrarExecucaoUseCase';

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

const makeOSEmExecucao = () => {
  const os = OrdemDeServico.criar({
    numero: 1,
    clienteId: new UniqueID().toValue(),
    veiculoId: new UniqueID().toValue(),
  });
  os.transicionarPara(StatusOSEnum.EM_DIAGNOSTICO);
  os.transicionarPara(StatusOSEnum.AGUARDANDO_APROVACAO);
  os.aprovarOrcamento();
  return os;
};

describe('RegistrarExecucaoUseCase', () => {
  let osRepo: InMemoryOSRepository;
  let useCase: RegistrarExecucaoUseCase;

  beforeEach(() => {
    osRepo = new InMemoryOSRepository();
    useCase = new RegistrarExecucaoUseCase(osRepo);
  });

  it('registra execução sem insumos', async () => {
    const os = makeOSEmExecucao();
    osRepo.ordens.push(os);
    const result = await useCase.execute({
      ordemDeServicoId: os.id.toValue(),
      servicoId: new UniqueID().toValue(),
      mecanicoId: new UniqueID().toValue(),
      inicio: new Date('2024-01-01T08:00:00'),
      fim: new Date('2024-01-01T10:00:00'),
    });
    expect(result.execucoes).toHaveLength(1);
  });

  it('registra execução em andamento (sem fim)', async () => {
    const os = makeOSEmExecucao();
    osRepo.ordens.push(os);
    const result = await useCase.execute({
      ordemDeServicoId: os.id.toValue(),
      servicoId: new UniqueID().toValue(),
      mecanicoId: new UniqueID().toValue(),
      inicio: new Date(),
    });
    expect(result.execucoes).toHaveLength(1);
    expect(result.execucoes[0].emAndamento).toBe(true);
  });

  it('lança NotFoundException quando OS não existe', async () => {
    await expect(
      useCase.execute({
        ordemDeServicoId: new UniqueID().toValue(),
        servicoId: new UniqueID().toValue(),
        mecanicoId: new UniqueID().toValue(),
        inicio: new Date(),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
