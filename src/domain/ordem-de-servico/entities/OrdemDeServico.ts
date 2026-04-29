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
import { ItemOrcamento, NovoItemOrcamentoInput, TipoItemOrcamento } from './ItemOrcamento';

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
    const status = itens.length > 0 ? StatusOS.create(StatusOSEnum.EM_DIAGNOSTICO) : StatusOS.inicial();
    const os = new OrdemDeServico({
      numero: NumeroOS.create(input.numero),
      clienteId: new UniqueID(input.clienteId),
      veiculoId: new UniqueID(input.veiculoId),
      status,
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
    const existente = this.props.itensOrcamento.find(
      (i) => i.tipo === input.tipo && i.referenciaId.toValue() === input.referenciaId,
    );
    if (existente) {
      existente.incrementarQuantidade(input.quantidade);
    } else {
      this.props.itensOrcamento.push(ItemOrcamento.criar(input));
    }
    if (this.props.status.value === StatusOSEnum.RECEBIDA) {
      this.props.status = this.props.status.transicionar(StatusOSEnum.EM_DIAGNOSTICO);
    }
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

  public avancarStatus(): void {
    const status = this.props.status.value;
    if (status === StatusOSEnum.EM_DIAGNOSTICO) {
      if (this.props.itensOrcamento.length === 0) {
        throw new DomainError(
          'Adicione pelo menos um item ao orçamento antes de avançar',
          'OS_SEM_ITEM_PARA_AVANCAR',
        );
      }
      this.transicionarPara(StatusOSEnum.AGUARDANDO_APROVACAO);
      return;
    }
    if (status === StatusOSEnum.FINALIZADA) {
      this.transicionarPara(StatusOSEnum.ENTREGUE);
      return;
    }
    throw new DomainError(
      `Não há avanço manual disponível a partir do status ${status}`,
      'OS_SEM_AVANCO_DISPONIVEL',
    );
  }

  public aprovarOrcamento(): void {
    if (this.props.status.value !== StatusOSEnum.AGUARDANDO_APROVACAO) {
      throw new DomainError(
        'Só é possível aprovar orçamento no status AGUARDANDO_APROVACAO',
        'APROVACAO_FASE_INVALIDA',
      );
    }
    this.props.status = this.props.status.transicionar(StatusOSEnum.APROVADA);
    this.touch();
    this.addDomainEvent(new OrcamentoAprovado(this.id));
  }

  public recusarOrcamento(motivo: 'TOTAL' = 'TOTAL'): void {
    if (this.props.status.value !== StatusOSEnum.AGUARDANDO_APROVACAO) {
      throw new DomainError(
        'Só é possível recusar orçamento no status AGUARDANDO_APROVACAO',
        'RECUSA_FASE_INVALIDA',
      );
    }
    this.props.status = this.props.status.transicionar(StatusOSEnum.REPROVADA);
    this.touch();
    this.addDomainEvent(new OrcamentoRecusado(this.id, motivo));
  }

  public registrarPontoExecucao(itemOrcamentoId: string, mecanicoId: string): void {
    const item = this.props.itensOrcamento.find((i) => i.id.toValue() === itemOrcamentoId);
    if (!item) {
      throw new DomainError('Item de orçamento não encontrado nesta OS', 'ITEM_NAO_ENCONTRADO');
    }
    if (item.tipo !== TipoItemOrcamento.SERVICO) {
      throw new DomainError(
        'Apenas itens do tipo SERVICO podem ser executados',
        'EXECUCAO_TIPO_INVALIDO',
      );
    }

    const execucao = this.props.execucoes.find(
      (e) => e.itemOrcamentoId.toValue() === itemOrcamentoId,
    );

    if (!execucao) {
      const status = this.props.status.value;
      if (status !== StatusOSEnum.APROVADA && status !== StatusOSEnum.EM_EXECUCAO) {
        throw new DomainError(
          'OS precisa estar APROVADA ou em execução para iniciar um item',
          'EXECUCAO_FASE_INVALIDA',
        );
      }
      const nova = ExecucaoDeServico.criar({
        itemOrcamentoId,
        servicoId: item.referenciaId.toValue(),
        mecanicoId,
        inicio: new Date(),
      });
      this.props.execucoes.push(nova);
      this.addDomainEvent(new ServicoExecutado(this.id, nova.id));
      if (status === StatusOSEnum.APROVADA) {
        this.props.status = this.props.status.transicionar(StatusOSEnum.EM_EXECUCAO);
      }
      this.touch();
      return;
    }

    if (execucao.fim) {
      throw new DomainError('Execução já finalizada', 'EXECUCAO_JA_FINALIZADA');
    }

    execucao.finalizar(new Date());
    this.touch();
    if (this.todasExecucoesFinalizadasParaItensServico) {
      this.transicionarPara(StatusOSEnum.FINALIZADA);
    }
  }

  public get todasExecucoesFinalizadas(): boolean {
    return this.props.execucoes.length > 0 && this.props.execucoes.every((e) => !e.emAndamento);
  }

  private get todasExecucoesFinalizadasParaItensServico(): boolean {
    const itensServico = this.props.itensOrcamento.filter(
      (i) => i.tipo === TipoItemOrcamento.SERVICO,
    );
    if (itensServico.length === 0) return false;
    return itensServico.every((item) => {
      const exec = this.props.execucoes.find(
        (e) => e.itemOrcamentoId.toValue() === item.id.toValue(),
      );
      return exec !== undefined && exec.fim !== undefined;
    });
  }
}
