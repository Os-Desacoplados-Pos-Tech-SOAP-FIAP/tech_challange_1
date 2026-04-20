import { NotFoundException } from '@nestjs/common';

import { PecaInsumo, TipoPecaInsumo } from '../../../domain/peca-insumo/entities/PecaInsumo';
import { IPecaInsumoRepository } from '../../../domain/peca-insumo/repositories/IPecaInsumoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { AtualizarEstoqueUseCase } from './AtualizarEstoqueUseCase';

class InMemoryPecaRepository implements IPecaInsumoRepository {
  public pecas: PecaInsumo[] = [];
  async salvar(p: PecaInsumo) { const i = this.pecas.findIndex(x => x.id.equals(p.id)); if (i >= 0) this.pecas[i] = p; else this.pecas.push(p); }
  async buscarPorId(id: UniqueID) { return this.pecas.find(p => p.id.equals(id)) ?? null; }
  async buscarPorCodigo(codigo: string) { return this.pecas.find(p => p.codigo.value === codigo) ?? null; }
  async listar() { return this.pecas; }
  async remover(id: UniqueID) { this.pecas = this.pecas.filter(p => !p.id.equals(id)); }
}

describe('AtualizarEstoqueUseCase', () => {
  let repo: InMemoryPecaRepository;
  let useCase: AtualizarEstoqueUseCase;
  let peca: PecaInsumo;

  beforeEach(() => {
    repo = new InMemoryPecaRepository();
    useCase = new AtualizarEstoqueUseCase(repo);
    peca = PecaInsumo.criar({ codigo: 'FIL-001', nome: 'Filtro de Óleo', tipo: TipoPecaInsumo.PECA, valorUnitario: 45, quantidadeEstoque: 10, estoqueMinimo: 2 });
    repo.pecas.push(peca);
  });

  it('atualiza quantidade do estoque', async () => {
    const result = await useCase.execute({ id: peca.id.toValue(), quantidade: 20 });
    expect(result.estoque.quantidade).toBe(20);
  });

  it('atualiza quantidade e mínimo', async () => {
    const result = await useCase.execute({ id: peca.id.toValue(), quantidade: 15, minimo: 5 });
    expect(result.estoque.quantidade).toBe(15);
    expect(result.estoque.minimo).toBe(5);
  });

  it('lança NotFoundException para peça inexistente', async () => {
    await expect(useCase.execute({ id: new UniqueID().toValue(), quantidade: 10 })).rejects.toBeInstanceOf(NotFoundException);
  });
});
