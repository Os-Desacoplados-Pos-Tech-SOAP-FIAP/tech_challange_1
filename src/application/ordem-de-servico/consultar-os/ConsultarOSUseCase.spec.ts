import { NotFoundException } from '@nestjs/common';

import { UniqueID } from '../../../domain/shared/UniqueID';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { ConsultarOSUseCase } from './ConsultarOSUseCase';

class InMemoryOSRepository implements IOrdemDeServicoRepository {
  public ordens: OrdemDeServico[] = [];
  async salvar(os: OrdemDeServico) { this.ordens.push(os); }
  async buscarPorId(id: UniqueID) { return this.ordens.find(o => o.id.equals(id)) ?? null; }
  async buscarPorNumero(n: number) { return this.ordens.find(o => o.numero.value === n) ?? null; }
  async buscarPorItemOrcamentoId(id: UniqueID) { return this.ordens.find(o => o.itensOrcamento.some(i => i.id.equals(id))) ?? null; }
  async listar() { return this.ordens; }
  async proximoNumero() { return this.ordens.length + 1; }
  async tempoMedioExecucaoMinutos() { return 0; }
  async tempoMedioExecucaoPorServico() { return []; }
}

describe('ConsultarOSUseCase', () => {
  let repo: InMemoryOSRepository;
  let useCase: ConsultarOSUseCase;
  let os: OrdemDeServico;

  beforeEach(() => {
    repo = new InMemoryOSRepository();
    useCase = new ConsultarOSUseCase(repo);
    os = OrdemDeServico.criar({ numero: 42, clienteId: new UniqueID().toValue(), veiculoId: new UniqueID().toValue() });
    repo.ordens.push(os);
  });

  it('consulta OS por id', async () => {
    const result = await useCase.porId(os.id.toValue());
    expect(result.id.equals(os.id)).toBe(true);
  });

  it('lança NotFoundException por id inexistente', async () => {
    await expect(useCase.porId(new UniqueID().toValue())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('consulta OS por número', async () => {
    const result = await useCase.porNumero(42);
    expect(result.numero.value).toBe(42);
  });

  it('lança NotFoundException por número inexistente', async () => {
    await expect(useCase.porNumero(999)).rejects.toBeInstanceOf(NotFoundException);
  });
});
