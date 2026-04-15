import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PerfilAcesso } from '@prisma/client';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { IHashProvider } from '../../../infrastructure/auth/hash.provider';

export interface LoginResult {
  accessToken: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    perfil: PerfilAcesso;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(INJECTION_TOKENS.HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(email: string, senha: string): Promise<LoginResult> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const senhaConfere = await this.hashProvider.compare(senha, usuario.senha);
    if (!senhaConfere) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const accessToken = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
    });
    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    };
  }
}
