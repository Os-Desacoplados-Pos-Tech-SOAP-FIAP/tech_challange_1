import { OsStateMachine, PerfilSolicitante } from '../state-machine/OsStateMachine';
import { StatusOSEnum } from './StatusOSEnum';

export { StatusOSEnum };

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
    return OsStateMachine.canTransition(this._value, novo);
  }

  public transicionar(novo: StatusOSEnum, perfil?: PerfilSolicitante): StatusOS {
    if (perfil) {
      OsStateMachine.assertRoleAllowed(this._value, novo, perfil);
    } else {
      OsStateMachine.assertTransition(this._value, novo);
    }
    return new StatusOS(novo);
  }

  public equals(other: StatusOS): boolean {
    return this._value === other._value;
  }
}
