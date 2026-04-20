import { DomainError } from '../../shared/DomainError';
import { Entity, EntityProps } from '../../shared/Entity';
import { UniqueID } from '../../shared/UniqueID';

export interface PecaUtilizada {
  pecaInsumoId: UniqueID;
  quantidade: number;
}

export interface ExecucaoDeServicoProps extends EntityProps {
  servicoId: UniqueID;
  mecanicoId: UniqueID;
  inicio: Date;
  fim?: Date;
  observacoes?: string;
  pecasUtilizadas: PecaUtilizada[];
}

export interface NovaExecucaoInput {
  servicoId: string;
  mecanicoId: string;
  inicio: Date;
  fim?: Date;
  observacoes?: string;
  pecasUtilizadas?: Array<{ pecaInsumoId: string; quantidade: number }>;
}

export class ExecucaoDeServico extends Entity<ExecucaoDeServicoProps> {
  private constructor(props: ExecucaoDeServicoProps, id?: UniqueID) {
    super(props, id);
  }

  public static criar(input: NovaExecucaoInput): ExecucaoDeServico {
    if (input.fim && input.fim < input.inicio) {
      throw new DomainError('Fim anterior ao início da execução', 'EXECUCAO_PERIODO_INVALIDO');
    }
    return new ExecucaoDeServico({
      servicoId: new UniqueID(input.servicoId),
      mecanicoId: new UniqueID(input.mecanicoId),
      inicio: input.inicio,
      fim: input.fim,
      observacoes: input.observacoes?.trim(),
      pecasUtilizadas: (input.pecasUtilizadas ?? []).map((p) => ({
        pecaInsumoId: new UniqueID(p.pecaInsumoId),
        quantidade: p.quantidade,
      })),
    });
  }

  public static restaurar(props: ExecucaoDeServicoProps, id: UniqueID): ExecucaoDeServico {
    return new ExecucaoDeServico(props, id);
  }

  public get servicoId(): UniqueID {
    return this.props.servicoId;
  }
  public get mecanicoId(): UniqueID {
    return this.props.mecanicoId;
  }
  public get inicio(): Date {
    return this.props.inicio;
  }
  public get fim(): Date | undefined {
    return this.props.fim;
  }
  public get observacoes(): string | undefined {
    return this.props.observacoes;
  }
  public get pecasUtilizadas(): ReadonlyArray<PecaUtilizada> {
    return this.props.pecasUtilizadas;
  }

  public get tempoExecucaoMinutos(): number | undefined {
    if (!this.props.fim) return undefined;
    return Math.round((this.props.fim.getTime() - this.props.inicio.getTime()) / 60000);
  }
}
