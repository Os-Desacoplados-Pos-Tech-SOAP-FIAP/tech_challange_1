import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PerfilAcesso } from '@prisma/client';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { IUsuarioRepository } from '../../../domain/auth/repositories/IUsuarioRepository';
import { IHashProvider } from '../../../infrastructure/auth/hash.provider';
import { perfilParaPrisma } from '../perfil-acesso.mapper';

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
    @Inject(INJECTION_TOKENS.USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly jwtService: JwtService,
    @Inject(INJECTION_TOKENS.HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(email: string, senha: string): Promise<LoginResult> {
    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const senhaConfere = await this.hashProvider.compare(senha, usuario.senha);
    if (!senhaConfere) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const perfil = perfilParaPrisma(usuario.perfil);
    const id = usuario.id.toValue();
    const accessToken = this.jwtService.sign({
      sub: id,
      email: usuario.email,
      perfil,
    });
    return {
      accessToken,
      usuario: {
        id,
        nome: usuario.nome,
        email: usuario.email,
        perfil,
      },
    };
  }
}
