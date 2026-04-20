import { DomainError } from '../../shared/DomainError';
import { ValueObject } from '../../shared/ValueObject';

interface ValorEstimadoProps {
  value: number;
}

export class ValorEstimado extends ValueObject<ValorEstimadoProps> {
  private constructor(props: ValorEstimadoProps) {
    super(props);
  }

  public static create(value: number): ValorEstimado {
    if (!Number.isFinite(value) || value < 0) {
      throw new DomainError(`Valor estimado inválido: ${value}`, 'VALOR_INVALIDO');
    }
    return new ValorEstimado({ value: Math.round(value * 100) / 100 });
  }

  public static zero(): ValorEstimado {
    return new ValorEstimado({ value: 0 });
  }

  public get value(): number {
    return this.props.value;
  }

  public somar(outro: ValorEstimado): ValorEstimado {
    return ValorEstimado.create(this.props.value + outro.props.value);
  }
}
