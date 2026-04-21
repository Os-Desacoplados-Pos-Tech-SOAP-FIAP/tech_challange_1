import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PerfilAcesso } from '@prisma/client';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { IHashProvider } from '../../../infrastructure/auth/hash.provider';

export interface RegistrarUsuarioInput {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilAcesso;
  solicitantePerfil?: PerfilAcesso;
}

@Injectable()
export class RegistrarUsuarioUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(INJECTION_TOKENS.HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(input: RegistrarUsuarioInput) {
    if (!input.nome || !input.email || !input.senha) {
      throw new BadRequestException('Dados obrigatórios ausentes');
    }

    const existente = await this.prisma.usuario.findUnique({ where: { email: input.email } });
    if (existente) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const senhaHash = await this.hashProvider.hash(input.senha);
    const usuario = await this.prisma.usuario.create({
      data: {
        nome: input.nome,
        email: input.email,
        senha: senhaHash,
        perfil: input.perfil,
      },
    });
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
  }
}
