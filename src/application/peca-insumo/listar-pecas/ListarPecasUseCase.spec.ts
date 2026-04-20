import { PecaInsumo, TipoPecaInsumo } from '../../../domain/peca-insumo/entities/PecaInsumo';
import { IPecaInsumoRepository } from '../../../domain/peca-insumo/repositories/IPecaInsumoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { ListarPecasUseCase } from './ListarPecasUseCase';

class InMemoryPecaRepository implements IPecaInsumoRepository {
  public pecas: PecaInsumo[] = [];
  async salvar(p: PecaInsumo) { this.pecas.push(p); }
  async buscarPorId(id: UniqueID) { return this.pecas.find(p => p.id.equals(id)) ?? null; }
  async buscarPorCodigo(codigo: string) { return this.pecas.find(p => p.codigo.value === codigo) ?? null; }
  async listar() { return this.pecas; }
  async remover(id: UniqueID) { this.pecas = this.pecas.filter(p => !p.id.equals(id)); }
}

describe('ListarPecasUseCase', () => {
  it('retorna lista vazia', async () => {
    const useCase = new ListarPecasUseCase(new InMemoryPecaRepository());
    expect(await useCase.execute()).toHaveLength(0);
  });

  it('retorna peças cadastradas', async () => {
    const repo = new InMemoryPecaRepository();
    repo.pecas.push(PecaInsumo.criar({ codigo: 'FIL-001', nome: 'Filtro de Óleo', tipo: TipoPecaInsumo.PECA, valorUnitario: 45, quantidadeEstoque: 10, estoqueMinimo: 2 }));
    repo.pecas.push(PecaInsumo.criar({ codigo: 'OL-001', nome: 'Óleo', tipo: TipoPecaInsumo.INSUMO, valorUnitario: 30, quantidadeEstoque: 20, estoqueMinimo: 5 }));
    const useCase = new ListarPecasUseCase(repo);
    expect(await useCase.execute()).toHaveLength(2);
  });
});
