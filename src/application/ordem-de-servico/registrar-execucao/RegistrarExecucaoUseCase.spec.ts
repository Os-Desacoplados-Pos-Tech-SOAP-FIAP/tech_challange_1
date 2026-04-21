import { NotFoundException } from '@nestjs/common';

import { UniqueID } from '../../../domain/shared/UniqueID';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { StatusOSEnum } from '../../../domain/ordem-de-servico/value-objects/StatusOS';
import { PecaInsumo, TipoPecaInsumo } from '../../../domain/peca-insumo/entities/PecaInsumo';
import { IPecaInsumoRepository } from '../../../domain/peca-insumo/repositories/IPecaInsumoRepository';
import { RegistrarExecucaoUseCase } from './RegistrarExecucaoUseCase';

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

class InMemoryPecaRepository implements IPecaInsumoRepository {
  public pecas: PecaInsumo[] = [];
  async salvar(p: PecaInsumo) { const i = this.pecas.findIndex(x => x.id.equals(p.id)); if (i >= 0) this.pecas[i] = p; else this.pecas.push(p); }
  async buscarPorId(id: UniqueID) { return this.pecas.find(p => p.id.equals(id)) ?? null; }
  async buscarPorCodigo(codigo: string) { return this.pecas.find(p => p.codigo.value === codigo) ?? null; }
  async listar() { return this.pecas; }
  async remover(id: UniqueID) { this.pecas = this.pecas.filter(p => !p.id.equals(id)); }
}

const makeOSEmExecucao = () => {
  const os = OrdemDeServico.criar({ numero: 1, clienteId: new UniqueID().toValue(), veiculoId: new UniqueID().toValue() });
  os.transicionarPara(StatusOSEnum.EM_DIAGNOSTICO);
  os.transicionarPara(StatusOSEnum.AGUARDANDO_APROVACAO);
  os.aprovarOrcamento();
  return os;
};

describe('RegistrarExecucaoUseCase', () => {
  let osRepo: InMemoryOSRepository;
  let pecaRepo: InMemoryPecaRepository;
  let useCase: RegistrarExecucaoUseCase;

  beforeEach(() => {
    osRepo = new InMemoryOSRepository();
    pecaRepo = new InMemoryPecaRepository();
    useCase = new RegistrarExecucaoUseCase(osRepo, pecaRepo);
  });

  it('registra execução sem peças', async () => {
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

  it('registra execução com baixa de peça', async () => {
    const os = makeOSEmExecucao();
    osRepo.ordens.push(os);
    const peca = PecaInsumo.criar({ codigo: 'FIL-001', nome: 'Filtro', tipo: TipoPecaInsumo.PECA, valorUnitario: 45, quantidadeEstoque: 10, estoqueMinimo: 2 });
    pecaRepo.pecas.push(peca);

    await useCase.execute({
      ordemDeServicoId: os.id.toValue(),
      servicoId: new UniqueID().toValue(),
      mecanicoId: new UniqueID().toValue(),
      inicio: new Date('2024-01-01T08:00:00'),
      pecasUtilizadas: [{ pecaInsumoId: peca.id.toValue(), quantidade: 2 }],
    });
    expect(peca.estoque.quantidade).toBe(8);
  });

  it('lança NotFoundException quando OS não existe', async () => {
    await expect(useCase.execute({
      ordemDeServicoId: new UniqueID().toValue(),
      servicoId: new UniqueID().toValue(),
      mecanicoId: new UniqueID().toValue(),
      inicio: new Date(),
    })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lança NotFoundException quando peça não existe', async () => {
    const os = makeOSEmExecucao();
    osRepo.ordens.push(os);
    await expect(useCase.execute({
      ordemDeServicoId: os.id.toValue(),
      servicoId: new UniqueID().toValue(),
      mecanicoId: new UniqueID().toValue(),
      inicio: new Date(),
      pecasUtilizadas: [{ pecaInsumoId: new UniqueID().toValue(), quantidade: 1 }],
    })).rejects.toBeInstanceOf(NotFoundException);
  });
});
