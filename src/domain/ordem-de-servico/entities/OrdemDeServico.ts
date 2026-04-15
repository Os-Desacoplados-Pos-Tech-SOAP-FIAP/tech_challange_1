import { AggregateRoot } from '../../shared/AggregateRoot';
import { DomainError } from '../../shared/DomainError';
import { EntityProps } from '../../shared/Entity';
import { UniqueID } from '../../shared/UniqueID';
import { DiagnosticoConcluido } from '../events/DiagnosticoConcluido';
import { OrcamentoAprovado } from '../events/OrcamentoAprovado';
import { OrcamentoEnviado } from '../events/OrcamentoEnviado';
import { OrcamentoRecusado } from '../events/OrcamentoRecusado';
import { OSCriada } from '../events/OSCriada';
import { OSEntregue } from '../events/OSEntregue';
import { OSFinalizada } from '../events/OSFinalizada';
import { ServicoExecutado } from '../events/ServicoExecutado';
import { NumeroOS } from '../value-objects/NumeroOS';
import { StatusOS, StatusOSEnum } from '../value-objects/StatusOS';
import { ValorEstimado } from '../value-objects/ValorEstimado';
import { ExecucaoDeServico } from './ExecucaoDeServico';
import { ItemOrcamento, NovoItemOrcamentoInput } from './ItemOrcamento';

export interface OrdemDeServicoProps extends EntityProps {
  numero: NumeroOS;
  clienteId: UniqueID;
  veiculoId: UniqueID;
  status: StatusOS;
  itensOrcamento: ItemOrcamento[];
  execucoes: ExecucaoDeServico[];
  observacoes?: string;
}

export interface NovaOSInput {
  numero: number;
  clienteId: string;
  veiculoId: string;
  observacoes?: string;
  itensIniciais?: NovoItemOrcamentoInput[];
}

export class OrdemDeServico extends AggregateRoot<OrdemDeServicoProps> {
  private constructor(props: OrdemDeServicoProps, id?: UniqueID) {
    super(props, id);
  }

  public static criar(input: NovaOSInput): OrdemDeServico {
    const itens = (input.itensIniciais ?? []).map((i) => ItemOrcamento.criar(i));
    const os = new OrdemDeServico({
      numero: NumeroOS.create(input.numero),
      clienteId: new UniqueID(input.clienteId),
      veiculoId: new UniqueID(input.veiculoId),
      status: StatusOS.inicial(),
      itensOrcamento: itens,
      execucoes: [],
      observacoes: input.observacoes?.trim(),
    });
    os.addDomainEvent(new OSCriada(os.id));
    return os;
  }

  public static restaurar(props: OrdemDeServicoProps, id: UniqueID): OrdemDeServico {
    return new OrdemDeServico(props, id);
  }

  public get numero(): NumeroOS {
    return this.props.numero;
  }
  public get clienteId(): UniqueID {
    return this.props.clienteId;
  }
  public get veiculoId(): UniqueID {
    return this.props.veiculoId;
  }
  public get status(): StatusOS {
    return this.props.status;
  }
  public get itensOrcamento(): ReadonlyArray<ItemOrcamento> {
    return this.props.itensOrcamento;
  }
  public get execucoes(): ReadonlyArray<ExecucaoDeServico> {
    return this.props.execucoes;
  }
  public get observacoes(): string | undefined {
    return this.props.observacoes;
  }

  public get valorEstimado(): ValorEstimado {
    return this.props.itensOrcamento.reduce(
      (acc, item) => acc.somar(ValorEstimado.create(item.valorTotal)),
      ValorEstimado.zero(),
    );
  }

  public adicionarItem(input: NovoItemOrcamentoInput): void {
    if (
      this.props.status.value !== StatusOSEnum.RECEBIDA &&
      this.props.status.value !== StatusOSEnum.EM_DIAGNOSTICO &&
      this.props.status.value !== StatusOSEnum.AGUARDANDO_APROVACAO
    ) {
      throw new DomainError(
        'Não é possível adicionar itens após aprovação do orçamento',
        'ITEM_FASE_INVALIDA',
      );
    }
    this.props.itensOrcamento.push(ItemOrcamento.criar(input));
    this.touch();
  }

  public transicionarPara(novoStatus: StatusOSEnum): void {
    this.props.status = this.props.status.transicionar(novoStatus);
    this.touch();
    if (novoStatus === StatusOSEnum.AGUARDANDO_APROVACAO) {
      this.addDomainEvent(new DiagnosticoConcluido(this.id));
      this.addDomainEvent(new OrcamentoEnviado(this.id));
    }
    if (novoStatus === StatusOSEnum.FINALIZADA) {
      this.addDomainEvent(new OSFinalizada(this.id));
    }
    if (novoStatus === StatusOSEnum.ENTREGUE) {
      this.addDomainEvent(new OSEntregue(this.id));
    }
  }

  public aprovarOrcamento(): void {
    if (this.props.status.value !== StatusOSEnum.AGUARDANDO_APROVACAO) {
      throw new DomainError(
        'Só é possível aprovar orçamento no status AGUARDANDO_APROVACAO',
        'APROVACAO_FASE_INVALIDA',
      );
    }
    this.transicionarPara(StatusOSEnum.EM_EXECUCAO);
    this.addDomainEvent(new OrcamentoAprovado(this.id));
  }

  public recusarOrcamento(motivo: 'TOTAL' | 'PARCIAL'): void {
    if (this.props.status.value !== StatusOSEnum.AGUARDANDO_APROVACAO) {
      throw new DomainError(
        'Só é possível recusar orçamento no status AGUARDANDO_APROVACAO',
        'RECUSA_FASE_INVALIDA',
      );
    }
    if (motivo === 'TOTAL') {
      this.transicionarPara(StatusOSEnum.CANCELADA);
    } else {
      this.props.status = this.props.status.transicionar(StatusOSEnum.EM_DIAGNOSTICO);
      this.touch();
    }
    this.addDomainEvent(new OrcamentoRecusado(this.id, motivo));
  }

  public registrarExecucao(execucao: ExecucaoDeServico): void {
    if (this.props.status.value !== StatusOSEnum.EM_EXECUCAO) {
      throw new DomainError(
        'Só é possível registrar execução com OS em execução',
        'EXECUCAO_FASE_INVALIDA',
      );
    }
    this.props.execucoes.push(execucao);
    this.touch();
    this.addDomainEvent(new ServicoExecutado(this.id, execucao.id));
  }
}
