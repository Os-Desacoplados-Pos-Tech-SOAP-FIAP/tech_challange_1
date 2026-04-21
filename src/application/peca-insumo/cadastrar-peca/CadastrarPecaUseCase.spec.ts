import { ConflictException } from '@nestjs/common';

import { PecaInsumo, TipoPecaInsumo } from '../../../domain/peca-insumo/entities/PecaInsumo';
import { IPecaInsumoRepository } from '../../../domain/peca-insumo/repositories/IPecaInsumoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { CadastrarPecaUseCase } from './CadastrarPecaUseCase';

class InMemoryPecaRepository implements IPecaInsumoRepository {
  public pecas: PecaInsumo[] = [];
  async salvar(p: PecaInsumo) { this.pecas.push(p); }
  async buscarPorId(id: UniqueID) { return this.pecas.find(p => p.id.equals(id)) ?? null; }
  async buscarPorCodigo(codigo: string) { return this.pecas.find(p => p.codigo.value === codigo) ?? null; }
  async listar() { return this.pecas; }
  async remover(id: UniqueID) { this.pecas = this.pecas.filter(p => !p.id.equals(id)); }
}

const base = { codigo: 'FIL-001', nome: 'Filtro de Óleo', tipo: TipoPecaInsumo.PECA, valorUnitario: 45, quantidadeEstoque: 10, estoqueMinimo: 2 };

describe('CadastrarPecaUseCase', () => {
  it('cadastra peça válida', async () => {
    const repo = new InMemoryPecaRepository();
    const useCase = new CadastrarPecaUseCase(repo);
    const p = await useCase.execute(base);
    expect(p.nome).toBe('Filtro de Óleo');
    expect(repo.pecas).toHaveLength(1);
  });

  it('lança ConflictException para código duplicado', async () => {
    const repo = new InMemoryPecaRepository();
    const useCase = new CadastrarPecaUseCase(repo);
    await useCase.execute(base);
    await expect(useCase.execute({ ...base, nome: 'Outro Filtro' })).rejects.toBeInstanceOf(ConflictException);
  });
});
