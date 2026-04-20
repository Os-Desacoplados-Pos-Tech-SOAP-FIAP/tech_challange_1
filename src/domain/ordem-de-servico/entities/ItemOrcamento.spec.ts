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
});
