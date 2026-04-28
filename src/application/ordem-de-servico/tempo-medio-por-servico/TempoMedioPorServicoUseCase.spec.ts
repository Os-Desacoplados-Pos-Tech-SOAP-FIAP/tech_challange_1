import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import {
  IOrdemDeServicoRepository,
  TempoMedioPorServicoRow,
} from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { Servico } from '../../../domain/servico/entities/Servico';
import { IServicoRepository } from '../../../domain/servico/repositories/IServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { TempoMedioPorServicoUseCase } from './TempoMedioPorServicoUseCase';

class InMemoryOSRepository implements IOrdemDeServicoRepository {
  constructor(private readonly rows: TempoMedioPorServicoRow[]) {}
  async salvar(): Promise<void> {}
  async buscarPorId(): Promise<OrdemDeServico | null> {
    return null;
  }
  async buscarPorNumero(): Promise<OrdemDeServico | null> {
    return null;
  }
  async buscarPorItemOrcamentoId(): Promise<OrdemDeServico | null> {
    return null;
  }
  async listar(): Promise<OrdemDeServico[]> {
    return [];
  }
  async proximoNumero(): Promise<number> {
    return 1;
  }
  async tempoMedioExecucaoMinutos(): Promise<number> {
    return 0;
  }
  async tempoMedioExecucaoPorServico(): Promise<TempoMedioPorServicoRow[]> {
    return this.rows;
  }
}

class InMemoryServicoRepository implements IServicoRepository {
  constructor(private readonly servicos: Servico[]) {}
  async salvar(): Promise<void> {}
  async buscarPorId(id: UniqueID): Promise<Servico | null> {
    return this.servicos.find((s) => s.id.equals(id)) ?? null;
  }
  async listar(): Promise<Servico[]> {
    return this.servicos;
  }
  async remover(): Promise<void> {}
}

describe('TempoMedioPorServicoUseCase', () => {
  it('retorna uma entrada por serviço com nome e métricas', async () => {
    const trocaOleo = Servico.criar({
      nome: 'Troca de óleo',
      descricao: 'Troca completa',
      valorPadrao: 150,
    });
    const alinhamento = Servico.criar({
      nome: 'Alinhamento',
      descricao: 'Alinhamento e balanceamento',
      valorPadrao: 120,
    });

    const rows: TempoMedioPorServicoRow[] = [
      { servicoId: trocaOleo.id.toValue(), tempoMedioMinutos: 45, totalExecucoes: 3 },
      { servicoId: alinhamento.id.toValue(), tempoMedioMinutos: 90, totalExecucoes: 2 },
    ];

    const useCase = new TempoMedioPorServicoUseCase(
      new InMemoryOSRepository(rows),
      new InMemoryServicoRepository([trocaOleo, alinhamento]),
    );

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      servicoId: trocaOleo.id.toValue(),
      nome: 'Troca de óleo',
      tempoMedioMinutos: 45,
      totalExecucoes: 3,
    });
    expect(result).toContainEqual({
      servicoId: alinhamento.id.toValue(),
      nome: 'Alinhamento',
      tempoMedioMinutos: 90,
      totalExecucoes: 2,
    });
  });

  it('retorna lista vazia quando não há execuções concluídas', async () => {
    const useCase = new TempoMedioPorServicoUseCase(
      new InMemoryOSRepository([]),
      new InMemoryServicoRepository([]),
    );

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('omite rows cujo serviço não é encontrado no repositório', async () => {
    const servico = Servico.criar({
      nome: 'Troca de óleo',
      descricao: 'desc',
      valorPadrao: 100,
    });

    const rows: TempoMedioPorServicoRow[] = [
      { servicoId: servico.id.toValue(), tempoMedioMinutos: 30, totalExecucoes: 1 },
      {
        servicoId: '00000000-0000-0000-0000-000000000000',
        tempoMedioMinutos: 60,
        totalExecucoes: 5,
      },
    ];

    const useCase = new TempoMedioPorServicoUseCase(
      new InMemoryOSRepository(rows),
      new InMemoryServicoRepository([servico]),
    );

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].servicoId).toBe(servico.id.toValue());
  });
});
