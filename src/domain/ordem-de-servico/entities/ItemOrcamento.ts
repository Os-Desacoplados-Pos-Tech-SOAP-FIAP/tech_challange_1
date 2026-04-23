import { DomainError } from '../../shared/DomainError';
import { Entity, EntityProps } from '../../shared/Entity';
import { UniqueID } from '../../shared/UniqueID';

export enum TipoItemOrcamento {
  SERVICO = 'SERVICO',
  INSUMO = 'INSUMO',
}

export interface ItemOrcamentoProps extends EntityProps {
  tipo: TipoItemOrcamento;
  referenciaId: UniqueID;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface NovoItemOrcamentoInput {
  tipo: TipoItemOrcamento;
  referenciaId: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export class ItemOrcamento extends Entity<ItemOrcamentoProps> {
  private constructor(props: ItemOrcamentoProps, id?: UniqueID) {
    super(props, id);
  }

  public static criar(input: NovoItemOrcamentoInput): ItemOrcamento {
    if (!Number.isInteger(input.quantidade) || input.quantidade <= 0) {
      throw new DomainError('Quantidade inválida', 'ITEM_QTD_INVALIDA');
    }
    if (!Number.isFinite(input.valorUnitario) || input.valorUnitario < 0) {
      throw new DomainError('Valor unitário inválido', 'ITEM_VALOR_INVALIDO');
    }
    if (!input.descricao || input.descricao.trim().length < 1) {
      throw new DomainError('Descrição obrigatória', 'ITEM_DESC_INVALIDA');
    }
    return new ItemOrcamento({
      tipo: input.tipo,
      referenciaId: new UniqueID(input.referenciaId),
      descricao: input.descricao.trim(),
      quantidade: input.quantidade,
      valorUnitario: Math.round(input.valorUnitario * 100) / 100,
    });
  }

  public static restaurar(props: ItemOrcamentoProps, id: UniqueID): ItemOrcamento {
    return new ItemOrcamento(props, id);
  }

  public get tipo(): TipoItemOrcamento {
    return this.props.tipo;
  }
  public get referenciaId(): UniqueID {
    return this.props.referenciaId;
  }
  public get descricao(): string {
    return this.props.descricao;
  }
  public get quantidade(): number {
    return this.props.quantidade;
  }
  public get valorUnitario(): number {
    return this.props.valorUnitario;
  }

  public get valorTotal(): number {
    return Math.round(this.quantidade * this.valorUnitario * 100) / 100;
  }
}
