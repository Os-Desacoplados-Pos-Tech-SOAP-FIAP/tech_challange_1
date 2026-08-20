import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { ClienteAutenticado } from '../guards/cliente-jwt.guard';

export const CurrentCliente = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ClienteAutenticado =>
    ctx.switchToHttp().getRequest().cliente,
);
