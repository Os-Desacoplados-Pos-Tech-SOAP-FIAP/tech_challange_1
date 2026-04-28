import { DomainError } from '../../shared/DomainError';
import { UniqueID } from '../../shared/UniqueID';
import { ExecucaoDeServico } from './ExecucaoDeServico';

describe('ExecucaoDeServico', () => {
  const base = {
    itemOrcamentoId: new UniqueID().toValue(),
    servicoId: new UniqueID().toValue(),
    mecanicoId: new UniqueID().toValue(),
    inicio: new Date('2024-01-01T08:00:00'),
    fim: new Date('2024-01-01T10:00:00'),
  };

  it('cria execução válida', () => {
    const e = ExecucaoDeServico.criar(base);
    expect(e.servicoId).toBeDefined();
    expect(e.itemOrcamentoId.toValue()).toBe(base.itemOrcamentoId);
    expect(e.tempoExecucaoMinutos).toBe(120);
  });

  it('cria execução sem fim (em andamento)', () => {
    const e = ExecucaoDeServico.criar({ ...base, fim: undefined });
    expect(e.fim).toBeUndefined();
    expect(e.emAndamento).toBe(true);
    expect(e.tempoExecucaoMinutos).toBeUndefined();
  });

  it('lança DomainError quando fim < inicio', () => {
    expect(() =>
      ExecucaoDeServico.criar({
        ...base,
        fim: new Date('2024-01-01T07:00:00'),
      }),
    ).toThrow(DomainError);
  });

  it('finaliza execução em andamento', () => {
    const e = ExecucaoDeServico.criar({ ...base, fim: undefined });
    e.finalizar(new Date('2024-01-01T09:00:00'));
    expect(e.fim).toBeDefined();
    expect(e.emAndamento).toBe(false);
  });

  it('lança DomainError ao finalizar execução já finalizada', () => {
    const e = ExecucaoDeServico.criar(base);
    expect(() => e.finalizar(new Date('2024-01-01T11:00:00'))).toThrow(DomainError);
  });
});
