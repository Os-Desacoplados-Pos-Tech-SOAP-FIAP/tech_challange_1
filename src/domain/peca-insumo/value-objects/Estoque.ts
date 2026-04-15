import { DomainError } from '../../shared/DomainError';
import { ValueObject } from '../../shared/ValueObject';

interface EstoqueProps {
  quantidade: number;
  minimo: number;
}

export class Estoque extends ValueObject<EstoqueProps> {
  private constructor(props: EstoqueProps) {
    super(props);
  }

  public static create(quantidade: number, minimo: number): Estoque {
    if (!Number.isInteger(quantidade) || quantidade < 0) {
      throw new DomainError('Quantidade de estoque inválida', 'ESTOQUE_INVALIDO');
    }
    if (!Number.isInteger(minimo) || minimo < 0) {
      throw new DomainError('Estoque mínimo inválido', 'ESTOQUE_INVALIDO');
    }
    return new Estoque({ quantidade, minimo });
  }

  public get quantidade(): number {
    return this.props.quantidade;
  }

  public get minimo(): number {
    return this.props.minimo;
  }

  public abaixoDoMinimo(): boolean {
    return this.props.quantidade < this.props.minimo;
  }

  public baixar(qtd: number): Estoque {
    if (!Number.isInteger(qtd) || qtd <= 0) {
      throw new DomainError('Quantidade a baixar inválida', 'BAIXA_INVALIDA');
    }
    if (qtd > this.props.quantidade) {
      throw new DomainError('Estoque insuficiente para baixa', 'ESTOQUE_INSUFICIENTE');
    }
    return Estoque.create(this.props.quantidade - qtd, this.props.minimo);
  }

  public repor(qtd: number): Estoque {
    if (!Number.isInteger(qtd) || qtd <= 0) {
      throw new DomainError('Quantidade a repor inválida', 'REPOSICAO_INVALIDA');
    }
    return Estoque.create(this.props.quantidade + qtd, this.props.minimo);
  }
}
