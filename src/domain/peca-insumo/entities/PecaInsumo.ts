import { AggregateRoot } from '../../shared/AggregateRoot';
import { DomainError } from '../../shared/DomainError';
import { EntityProps } from '../../shared/Entity';
import { UniqueID } from '../../shared/UniqueID';
import { EstoqueAbaixoDoMinimo } from '../events/EstoqueAbaixoDoMinimo';
import { EstoqueBaixado } from '../events/EstoqueBaixado';
import { CodigoPeca } from '../value-objects/CodigoPeca';
import { Estoque } from '../value-objects/Estoque';
import { ValorUnitario } from '../value-objects/ValorUnitario';

export enum TipoPecaInsumo {
  PECA = 'PECA',
  INSUMO = 'INSUMO',
}

export interface PecaInsumoProps extends EntityProps {
  codigo: CodigoPeca;
  nome: string;
  tipo: TipoPecaInsumo;
  valorUnitario: ValorUnitario;
  estoque: Estoque;
}

export interface NovaPecaInsumoInput {
  codigo: string;
  nome: string;
  tipo: TipoPecaInsumo;
  valorUnitario: number;
  quantidadeEstoque: number;
  estoqueMinimo: number;
}

export class PecaInsumo extends AggregateRoot<PecaInsumoProps> {
  private constructor(props: PecaInsumoProps, id?: UniqueID) {
    super(props, id);
  }

  public static criar(input: NovaPecaInsumoInput): PecaInsumo {
    if (!input.nome || input.nome.trim().length < 2) {
      throw new DomainError('Nome da peça/insumo inválido', 'PECA_NOME_INVALIDO');
    }
    return new PecaInsumo({
      codigo: CodigoPeca.create(input.codigo),
      nome: input.nome.trim(),
      tipo: input.tipo,
      valorUnitario: ValorUnitario.create(input.valorUnitario),
      estoque: Estoque.create(input.quantidadeEstoque, input.estoqueMinimo),
    });
  }

  public static restaurar(props: PecaInsumoProps, id: UniqueID): PecaInsumo {
    return new PecaInsumo(props, id);
  }

  public get codigo(): CodigoPeca {
    return this.props.codigo;
  }
  public get nome(): string {
    return this.props.nome;
  }
  public get tipo(): TipoPecaInsumo {
    return this.props.tipo;
  }
  public get valorUnitario(): ValorUnitario {
    return this.props.valorUnitario;
  }
  public get estoque(): Estoque {
    return this.props.estoque;
  }

  public atualizarValor(valor: number): void {
    this.props.valorUnitario = ValorUnitario.create(valor);
    this.touch();
  }

  public atualizarEstoque(quantidade: number, minimo?: number): void {
    this.props.estoque = Estoque.create(
      quantidade,
      minimo ?? this.props.estoque.minimo,
    );
    this.touch();
  }

  public baixarEstoque(qtd: number): void {
    this.props.estoque = this.props.estoque.baixar(qtd);
    this.touch();
    this.addDomainEvent(new EstoqueBaixado(this.id, qtd));
    if (this.props.estoque.abaixoDoMinimo()) {
      this.addDomainEvent(new EstoqueAbaixoDoMinimo(this.id));
    }
  }

  public reporEstoque(qtd: number): void {
    this.props.estoque = this.props.estoque.repor(qtd);
    this.touch();
  }
}
