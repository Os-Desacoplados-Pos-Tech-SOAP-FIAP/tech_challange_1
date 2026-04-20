import { DomainError } from '../../shared/DomainError';
import { PecaInsumo, TipoPecaInsumo } from '../entities/PecaInsumo';
import { BaixaEstoqueService } from './BaixaEstoqueService';

describe('BaixaEstoqueService', () => {
  const makePeca = (qtd: number, min = 2) =>
    PecaInsumo.criar({
      codigo: 'PEC-001',
      nome: 'Filtro',
      tipo: TipoPecaInsumo.PECA,
      valorUnitario: 10,
      quantidadeEstoque: qtd,
      estoqueMinimo: min,
    });

  it('baixa corretamente estoque de múltiplas peças', () => {
    const service = new BaixaEstoqueService();
    const peca1 = makePeca(10);
    const peca2 = makePeca(5);
    service.executar([
      { peca: peca1, quantidade: 3 },
      { peca: peca2, quantidade: 2 },
    ]);
    expect(peca1.estoque.quantidade).toBe(7);
    expect(peca2.estoque.quantidade).toBe(3);
  });

  it('lança DomainError em baixa vazia', () => {
    const service = new BaixaEstoqueService();
    expect(() => service.executar([])).toThrow(DomainError);
  });

  it('lança DomainError em estoque insuficiente', () => {
    const service = new BaixaEstoqueService();
    const peca = makePeca(1);
    expect(() => service.executar([{ peca, quantidade: 5 }])).toThrow(DomainError);
  });
});
