import { DomainError } from '../../shared/DomainError';
import { StatusOSEnum } from '../value-objects/StatusOSEnum';

export interface Transition {
  from: StatusOSEnum;
  to: StatusOSEnum;
}

const TRANSITIONS: ReadonlyArray<Transition> = [
  { from: StatusOSEnum.RECEBIDA, to: StatusOSEnum.EM_DIAGNOSTICO },
  { from: StatusOSEnum.EM_DIAGNOSTICO, to: StatusOSEnum.AGUARDANDO_APROVACAO },
  { from: StatusOSEnum.AGUARDANDO_APROVACAO, to: StatusOSEnum.APROVADA },
  { from: StatusOSEnum.AGUARDANDO_APROVACAO, to: StatusOSEnum.REPROVADA },
  { from: StatusOSEnum.APROVADA, to: StatusOSEnum.EM_EXECUCAO },
  { from: StatusOSEnum.EM_EXECUCAO, to: StatusOSEnum.FINALIZADA },
  { from: StatusOSEnum.FINALIZADA, to: StatusOSEnum.ENTREGUE },
];

export class OsStateMachine {
  public static find(from: StatusOSEnum, to: StatusOSEnum): Transition | undefined {
    return TRANSITIONS.find((t) => t.from === from && t.to === to);
  }

  public static canTransition(from: StatusOSEnum, to: StatusOSEnum): boolean {
    return this.find(from, to) !== undefined;
  }

  public static assertTransition(from: StatusOSEnum, to: StatusOSEnum): void {
    if (!this.canTransition(from, to)) {
      throw new DomainError(
        `Transição inválida de ${from} para ${to}`,
        'TRANSICAO_STATUS_INVALIDA',
      );
    }
  }

  public static transitionsFrom(from: StatusOSEnum): ReadonlyArray<Transition> {
    return TRANSITIONS.filter((t) => t.from === from);
  }
}
