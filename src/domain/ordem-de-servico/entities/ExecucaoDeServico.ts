import { DomainError } from '../../shared/DomainError';
import { Entity, EntityProps } from '../../shared/Entity';
import { UniqueID } from '../../shared/UniqueID';

export interface ExecucaoDeServicoProps extends EntityProps {
  itemOrcamentoId: UniqueID;
  servicoId: UniqueID;
  mecanicoId: UniqueID;
  inicio: Date;
  fim?: Date;
}

export interface NovaExecucaoInput {
  itemOrcamentoId: string;
  servicoId: string;
  mecanicoId: string;
  inicio: Date;
  fim?: Date;
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
      itemOrcamentoId: new UniqueID(input.itemOrcamentoId),
      servicoId: new UniqueID(input.servicoId),
      mecanicoId: new UniqueID(input.mecanicoId),
      inicio: input.inicio,
      fim: input.fim,
    });
  }

  public static restaurar(props: ExecucaoDeServicoProps, id: UniqueID): ExecucaoDeServico {
    return new ExecucaoDeServico(props, id);
  }

  public get itemOrcamentoId(): UniqueID {
    return this.props.itemOrcamentoId;
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

  public get tempoExecucaoMinutos(): number | undefined {
    if (!this.props.fim) return undefined;
    return Math.round((this.props.fim.getTime() - this.props.inicio.getTime()) / 60000);
  }

  public get emAndamento(): boolean {
    return this.props.fim === undefined;
  }

  public finalizar(fim: Date = new Date()): void {
    if (this.props.fim) {
      throw new DomainError('Execução já finalizada', 'EXECUCAO_JA_FINALIZADA');
    }
    if (fim < this.props.inicio) {
      throw new DomainError('Fim anterior ao início da execução', 'EXECUCAO_PERIODO_INVALIDO');
    }
    this.props.fim = fim;
  }
}
