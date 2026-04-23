import { DomainError } from '../../shared/DomainError';
import { StatusOSEnum } from '../value-objects/StatusOSEnum';

export type PerfilSolicitante = 'ADMINISTRADOR' | 'ATENDENTE' | 'MECANICO' | 'CLIENTE';

export interface Transition {
  from: StatusOSEnum;
  to: StatusOSEnum;
  allowedRoles: ReadonlyArray<PerfilSolicitante>;
}

const TRANSITIONS: ReadonlyArray<Transition> = [
  { from: StatusOSEnum.RECEBIDA, to: StatusOSEnum.EM_DIAGNOSTICO, allowedRoles: ['ATENDENTE', 'MECANICO', 'ADMINISTRADOR'] },
  { from: StatusOSEnum.RECEBIDA, to: StatusOSEnum.CANCELADA, allowedRoles: ['ATENDENTE', 'ADMINISTRADOR'] },
  { from: StatusOSEnum.EM_DIAGNOSTICO, to: StatusOSEnum.AGUARDANDO_APROVACAO, allowedRoles: ['MECANICO', 'ADMINISTRADOR'] },
  { from: StatusOSEnum.EM_DIAGNOSTICO, to: StatusOSEnum.CANCELADA, allowedRoles: ['ATENDENTE', 'ADMINISTRADOR'] },
  { from: StatusOSEnum.AGUARDANDO_APROVACAO, to: StatusOSEnum.APROVADA, allowedRoles: ['CLIENTE'] },
  { from: StatusOSEnum.AGUARDANDO_APROVACAO, to: StatusOSEnum.REPROVADA, allowedRoles: ['CLIENTE'] },
  { from: StatusOSEnum.AGUARDANDO_APROVACAO, to: StatusOSEnum.CANCELADA, allowedRoles: ['ATENDENTE', 'ADMINISTRADOR'] },
  { from: StatusOSEnum.APROVADA, to: StatusOSEnum.EM_EXECUCAO, allowedRoles: ['MECANICO', 'ADMINISTRADOR'] },
  { from: StatusOSEnum.APROVADA, to: StatusOSEnum.CANCELADA, allowedRoles: ['ATENDENTE', 'ADMINISTRADOR'] },
  { from: StatusOSEnum.REPROVADA, to: StatusOSEnum.CANCELADA, allowedRoles: ['ATENDENTE', 'ADMINISTRADOR'] },
  { from: StatusOSEnum.EM_EXECUCAO, to: StatusOSEnum.FINALIZADA, allowedRoles: ['MECANICO', 'ADMINISTRADOR'] },
  { from: StatusOSEnum.EM_EXECUCAO, to: StatusOSEnum.CANCELADA, allowedRoles: ['ATENDENTE', 'ADMINISTRADOR'] },
  { from: StatusOSEnum.FINALIZADA, to: StatusOSEnum.ENTREGUE, allowedRoles: ['ATENDENTE', 'ADMINISTRADOR'] },
];

export class OsStateMachine {
  public static find(from: StatusOSEnum, to: StatusOSEnum): Transition | undefined {
    return TRANSITIONS.find((t) => t.from === from && t.to === to);
  }

  public static canTransition(from: StatusOSEnum, to: StatusOSEnum): boolean {
    return this.find(from, to) !== undefined;
  }

  public static allowsRole(from: StatusOSEnum, to: StatusOSEnum, role: PerfilSolicitante): boolean {
    const t = this.find(from, to);
    if (!t) return false;
    return t.allowedRoles.includes(role);
  }

  public static assertTransition(from: StatusOSEnum, to: StatusOSEnum): void {
    if (!this.canTransition(from, to)) {
      throw new DomainError(
        `Transição inválida de ${from} para ${to}`,
        'TRANSICAO_STATUS_INVALIDA',
      );
    }
  }

  public static assertRoleAllowed(
    from: StatusOSEnum,
    to: StatusOSEnum,
    role: PerfilSolicitante,
  ): void {
    this.assertTransition(from, to);
    if (!this.allowsRole(from, to, role)) {
      throw new DomainError(
        `Perfil ${role} não pode realizar transição de ${from} para ${to}`,
        'TRANSICAO_NAO_AUTORIZADA',
      );
    }
  }

  public static transitionsFrom(from: StatusOSEnum): ReadonlyArray<Transition> {
    return TRANSITIONS.filter((t) => t.from === from);
  }
}
