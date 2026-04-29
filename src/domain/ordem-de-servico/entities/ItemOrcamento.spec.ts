import { DomainError } from '../../shared/DomainError';
import { UniqueID } from '../../shared/UniqueID';
import { ItemOrcamento, TipoItemOrcamento } from './ItemOrcamento';

const base = {
  tipo: TipoItemOrcamento.SERVICO,
  referenciaId: new UniqueID().toValue(),
  descricao: 'Troca de óleo',
  quantidade: 2,
  valorUnitario: 50,
};

describe('ItemOrcamento', () => {
  it('cria item válido e calcula valorTotal', () => {
    const item = ItemOrcamento.criar(base);
    expect(item.valorTotal).toBe(100);
  });

  it('lança DomainError para quantidade zero', () => {
    expect(() => ItemOrcamento.criar({ ...base, quantidade: 0 })).toThrow(DomainError);
  });

  it('lança DomainError para quantidade negativa', () => {
    expect(() => ItemOrcamento.criar({ ...base, quantidade: -1 })).toThrow(DomainError);
  });

  it('lança DomainError para quantidade fracionada', () => {
    expect(() => ItemOrcamento.criar({ ...base, quantidade: 1.5 })).toThrow(DomainError);
  });

  it('lança DomainError para valor negativo', () => {
    expect(() => ItemOrcamento.criar({ ...base, valorUnitario: -1 })).toThrow(DomainError);
  });

  it('lança DomainError para descrição vazia', () => {
    expect(() => ItemOrcamento.criar({ ...base, descricao: '' })).toThrow(DomainError);
  });

  it('aceita valor zero (gratuito)', () => {
    const item = ItemOrcamento.criar({ ...base, valorUnitario: 0 });
    expect(item.valorTotal).toBe(0);
  });

  describe('incrementarQuantidade', () => {
    it('soma a quantidade e recalcula valorTotal', () => {
      const item = ItemOrcamento.criar(base);
      item.incrementarQuantidade(3);
      expect(item.quantidade).toBe(5);
      expect(item.valorTotal).toBe(250);
    });

    it('lança DomainError ITEM_QTD_INVALIDA para quantidade zero', () => {
      const item = ItemOrcamento.criar(base);
      try {
        item.incrementarQuantidade(0);
        fail('deveria lançar DomainError');
      } catch (err) {
        expect(err).toBeInstanceOf(DomainError);
        expect((err as DomainError).code).toBe('ITEM_QTD_INVALIDA');
      }
    });

    it('lança DomainError para quantidade negativa', () => {
      const item = ItemOrcamento.criar(base);
      expect(() => item.incrementarQuantidade(-2)).toThrow(DomainError);
    });

    it('lança DomainError para quantidade fracionada', () => {
      const item = ItemOrcamento.criar(base);
      expect(() => item.incrementarQuantidade(1.5)).toThrow(DomainError);
    });
  });
});
