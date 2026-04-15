import { DomainError } from '../../shared/DomainError';
import { ValueObject } from '../../shared/ValueObject';

interface NumeroOSProps {
  value: number;
}

export class NumeroOS extends ValueObject<NumeroOSProps> {
  private constructor(props: NumeroOSProps) {
    super(props);
  }

  public static create(value: number): NumeroOS {
    if (!Number.isInteger(value) || value <= 0) {
      throw new DomainError(`Número de OS inválido: ${value}`, 'NUMERO_OS_INVALIDO');
    }
    return new NumeroOS({ value });
  }

  public get value(): number {
    return this.props.value;
  }
}
