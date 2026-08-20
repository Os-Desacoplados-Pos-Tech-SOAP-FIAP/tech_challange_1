import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface ClienteAutenticado {
  id: string;
  cpf: string;
}

interface ClienteJwtPayload {
  sub: string;
  cpf: string;
  scope: string;
}

/**
 * Protege as rotas públicas de cliente com o JWT emitido pela Lambda de
 * autenticação por CPF (scope CLIENTE). Validação dupla: o API Gateway já
 * validou via Lambda authorizer; o app revalida para cobrir acesso direto ao ALB.
 */
@Injectable()
export class ClienteJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const auth: string = request.headers?.authorization ?? '';
    if (!auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de cliente ausente');
    }

    let payload: ClienteJwtPayload;
    try {
      payload = this.jwtService.verify<ClienteJwtPayload>(auth.slice(7));
    } catch {
      throw new UnauthorizedException('Token de cliente inválido');
    }

    if (payload.scope !== 'CLIENTE') {
      throw new UnauthorizedException('Token sem escopo de cliente');
    }

    request.cliente = { id: payload.sub, cpf: payload.cpf } satisfies ClienteAutenticado;
    return true;
  }
}
