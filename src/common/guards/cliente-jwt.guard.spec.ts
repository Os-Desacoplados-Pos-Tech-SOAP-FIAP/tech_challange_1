import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ClienteJwtGuard } from './cliente-jwt.guard';

const contextoCom = (authHeader?: string): ExecutionContext => {
  const request: Record<string, unknown> = { headers: { authorization: authHeader } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
};

describe('ClienteJwtGuard', () => {
  const jwt = new JwtService({ secret: 'segredo-teste' });
  const guard = new ClienteJwtGuard(jwt);

  it('autoriza token de escopo CLIENTE e anexa req.cliente', () => {
    const token = jwt.sign({ sub: 'cli-1', cpf: '52998224725', scope: 'CLIENTE' });
    const ctx = contextoCom(`Bearer ${token}`);
    expect(guard.canActivate(ctx)).toBe(true);
    const req = ctx.switchToHttp().getRequest() as { cliente?: { id: string; cpf: string } };
    expect(req.cliente).toEqual({ id: 'cli-1', cpf: '52998224725' });
  });

  it('rejeita token de funcionário (sem scope CLIENTE)', () => {
    const token = jwt.sign({ sub: 'u1', email: 'a@b.c', perfil: 'ATENDENTE' });
    expect(() => guard.canActivate(contextoCom(`Bearer ${token}`))).toThrow(UnauthorizedException);
  });

  it('rejeita sem header, header malformado e assinatura inválida', () => {
    expect(() => guard.canActivate(contextoCom(undefined))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(contextoCom('Token x'))).toThrow(UnauthorizedException);
    const outro = new JwtService({ secret: 'outro' }).sign({ scope: 'CLIENTE' });
    expect(() => guard.canActivate(contextoCom(`Bearer ${outro}`))).toThrow(UnauthorizedException);
  });
});
