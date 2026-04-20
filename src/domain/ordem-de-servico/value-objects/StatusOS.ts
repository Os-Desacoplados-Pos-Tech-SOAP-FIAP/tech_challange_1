import { DomainError } from '../../shared/DomainError';

export enum StatusOSEnum {
  RECEBIDA = 'RECEBIDA',
  EM_DIAGNOSTICO = 'EM_DIAGNOSTICO',
  AGUARDANDO_APROVACAO = 'AGUARDANDO_APROVACAO',
  EM_EXECUCAO = 'EM_EXECUCAO',
  FINALIZADA = 'FINALIZADA',
  ENTREGUE = 'ENTREGUE',
  CANCELADA = 'CANCELADA',
}

const TRANSICOES: Record<StatusOSEnum, StatusOSEnum[]> = {
  [StatusOSEnum.RECEBIDA]: [StatusOSEnum.EM_DIAGNOSTICO, StatusOSEnum.CANCELADA],
  [StatusOSEnum.EM_DIAGNOSTICO]: [StatusOSEnum.AGUARDANDO_APROVACAO, StatusOSEnum.CANCELADA],
  [StatusOSEnum.AGUARDANDO_APROVACAO]: [
    StatusOSEnum.EM_EXECUCAO,
    StatusOSEnum.EM_DIAGNOSTICO,
    StatusOSEnum.CANCELADA,
  ],
  [StatusOSEnum.EM_EXECUCAO]: [StatusOSEnum.FINALIZADA, StatusOSEnum.CANCELADA],
  [StatusOSEnum.FINALIZADA]: [StatusOSEnum.ENTREGUE],
  [StatusOSEnum.ENTREGUE]: [],
  [StatusOSEnum.CANCELADA]: [],
};

export class StatusOS {
  private constructor(private readonly _value: StatusOSEnum) {}

  public static create(value: StatusOSEnum): StatusOS {
    return new StatusOS(value);
  }

  public static inicial(): StatusOS {
    return new StatusOS(StatusOSEnum.RECEBIDA);
  }

  public get value(): StatusOSEnum {
    return this._value;
  }

  public podeTransicionarPara(novo: StatusOSEnum): boolean {
    return TRANSICOES[this._value].includes(novo);
  }

  public transicionar(novo: StatusOSEnum): StatusOS {
    if (!this.podeTransicionarPara(novo)) {
      throw new DomainError(
        `Transição inválida de ${this._value} para ${novo}`,
        'TRANSICAO_STATUS_INVALIDA',
      );
    }
    return new StatusOS(novo);
  }

  public equals(other: StatusOS): boolean {
    return this._value === other._value;
  }
}
