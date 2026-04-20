import { DomainError } from '../../shared/DomainError';
import { Estoque } from './Estoque';

describe('Estoque', () => {
  it('cria estoque válido', () => {
    const e = Estoque.create(10, 2);
    expect(e.quantidade).toBe(10);
    expect(e.minimo).toBe(2);
  });

  it('lança DomainError para quantidade negativa', () => {
    expect(() => Estoque.create(-1, 0)).toThrow(DomainError);
  });

  it('lança DomainError para mínimo negativo', () => {
    expect(() => Estoque.create(5, -1)).toThrow(DomainError);
  });

  it('lança DomainError para quantidade não inteira', () => {
    expect(() => Estoque.create(1.5, 0)).toThrow(DomainError);
  });

  it('abaixoDoMinimo retorna true quando quantidade < mínimo', () => {
    const e = Estoque.create(1, 3);
    expect(e.abaixoDoMinimo()).toBe(true);
  });

  it('abaixoDoMinimo retorna false quando quantidade >= mínimo', () => {
    const e = Estoque.create(3, 3);
    expect(e.abaixoDoMinimo()).toBe(false);
  });

  it('baixa estoque retorna novo VO imutável', () => {
    const e = Estoque.create(10, 2);
    const novo = e.baixar(3);
    expect(novo.quantidade).toBe(7);
    expect(e.quantidade).toBe(10); // imutável
  });

  it('lança DomainError em baixa com quantidade inválida', () => {
    const e = Estoque.create(10, 0);
    expect(() => e.baixar(0)).toThrow(DomainError);
    expect(() => e.baixar(-1)).toThrow(DomainError);
  });

  it('lança DomainError em estoque insuficiente', () => {
    const e = Estoque.create(2, 0);
    expect(() => e.baixar(5)).toThrow(DomainError);
  });

  it('repõe estoque', () => {
    const e = Estoque.create(5, 0);
    const novo = e.repor(3);
    expect(novo.quantidade).toBe(8);
  });

  it('lança DomainError em reposição inválida', () => {
    const e = Estoque.create(5, 0);
    expect(() => e.repor(0)).toThrow(DomainError);
  });
});
