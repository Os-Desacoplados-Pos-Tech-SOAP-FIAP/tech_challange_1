import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PerfilAcesso } from '@prisma/client';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { Usuario } from '../../../domain/auth/entities/Usuario';
import { IUsuarioRepository } from '../../../domain/auth/repositories/IUsuarioRepository';
import { IHashProvider } from '../../../infrastructure/auth/hash.provider';
import { perfilParaDominio, perfilParaPrisma } from '../perfil-acesso.mapper';

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
    @Inject(INJECTION_TOKENS.USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
    @Inject(INJECTION_TOKENS.HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(input: RegistrarUsuarioInput) {
    if (!input.nome || !input.email || !input.senha) {
      throw new BadRequestException('Dados obrigatórios ausentes');
    }

    const totalUsuarios = await this.usuarioRepository.contar();
    if (totalUsuarios > 0 && input.solicitantePerfil !== PerfilAcesso.ADMINISTRADOR) {
      throw new ForbiddenException('Apenas administradores podem registrar novos usuários');
    }

    const existente = await this.usuarioRepository.buscarPorEmail(input.email);
    if (existente) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const senhaHash = await this.hashProvider.hash(input.senha);
    const usuario = Usuario.criar({
      nome: input.nome,
      email: input.email,
      senha: senhaHash,
      perfil: perfilParaDominio(input.perfil),
    });
    await this.usuarioRepository.salvar(usuario);

    return {
      id: usuario.id.toValue(),
      nome: usuario.nome,
      email: usuario.email,
      perfil: perfilParaPrisma(usuario.perfil),
    };
  }
}
