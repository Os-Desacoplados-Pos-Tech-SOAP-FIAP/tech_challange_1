import { DomainError } from '../../shared/DomainError';
import { UniqueID } from '../../shared/UniqueID';
import { ExecucaoDeServico } from './ExecucaoDeServico';

describe('ExecucaoDeServico', () => {
  const base = {
    servicoId: new UniqueID().toValue(),
    mecanicoId: new UniqueID().toValue(),
    inicio: new Date('2024-01-01T08:00:00'),
    fim: new Date('2024-01-01T10:00:00'),
  };

  it('cria execução válida', () => {
    const e = ExecucaoDeServico.criar(base);
    expect(e.servicoId).toBeDefined();
    expect(e.tempoExecucaoMinutos).toBe(120);
  });

  it('cria execução sem fim', () => {
    const e = ExecucaoDeServico.criar({ ...base, fim: undefined });
    expect(e.fim).toBeUndefined();
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

  it('cria execução com insumos utilizados', () => {
    const e = ExecucaoDeServico.criar({
      ...base,
      insumosUtilizados: [{ insumoId: new UniqueID().toValue(), quantidade: 2 }],
    });
    expect(e.insumosUtilizados).toHaveLength(1);
  });

  it('cria execução com observações (trim)', () => {
    const e = ExecucaoDeServico.criar({ ...base, observacoes: '  obs  ' });
    expect(e.observacoes).toBe('obs');
  });
});
