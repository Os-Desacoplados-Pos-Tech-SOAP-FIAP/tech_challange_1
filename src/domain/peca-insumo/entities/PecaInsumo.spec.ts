import { DomainError } from '../../shared/DomainError';
import { PecaInsumo, TipoPecaInsumo } from './PecaInsumo';

const base = {
  codigo: 'FIL-001',
  nome: 'Filtro de Óleo',
  tipo: TipoPecaInsumo.PECA,
  valorUnitario: 45,
  quantidadeEstoque: 10,
  estoqueMinimo: 2,
};

describe('PecaInsumo', () => {
  it('cria peça válida', () => {
    const p = PecaInsumo.criar(base);
    expect(p.nome).toBe('Filtro de Óleo');
    expect(p.estoque.quantidade).toBe(10);
  });

  it('lança DomainError para nome curto', () => {
    expect(() => PecaInsumo.criar({ ...base, nome: 'A' })).toThrow(DomainError);
  });

  it('baixa estoque corretamente', () => {
    const p = PecaInsumo.criar(base);
    p.baixarEstoque(3);
    expect(p.estoque.quantidade).toBe(7);
  });

  it('lança DomainError em baixa maior que estoque', () => {
    const p = PecaInsumo.criar(base);
    expect(() => p.baixarEstoque(20)).toThrow(DomainError);
  });

  it('emite evento EstoqueAbaixoDoMinimo quando abaixo do mínimo', () => {
    const p = PecaInsumo.criar({ ...base, quantidadeEstoque: 3, estoqueMinimo: 3 });
    p.baixarEstoque(2);
    const eventNames = p.domainEvents.map((e) => e.constructor.name);
    expect(eventNames).toContain('EstoqueAbaixoDoMinimo');
  });

  it('repõe estoque', () => {
    const p = PecaInsumo.criar(base);
    p.reporEstoque(5);
    expect(p.estoque.quantidade).toBe(15);
  });

  it('atualiza valor unitário', () => {
    const p = PecaInsumo.criar(base);
    p.atualizarValor(99);
    expect(p.valorUnitario.value).toBe(99);
  });

  it('atualiza estoque com novo mínimo', () => {
    const p = PecaInsumo.criar(base);
    p.atualizarEstoque(20, 5);
    expect(p.estoque.quantidade).toBe(20);
    expect(p.estoque.minimo).toBe(5);
  });
});
