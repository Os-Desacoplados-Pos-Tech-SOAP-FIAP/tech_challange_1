import { Injectable } from '@nestjs/common';
import { PerfilAcesso as PrismaPerfilAcesso, Usuario as PrismaUsuario } from '@prisma/client';

import { Usuario } from '../../domain/auth/entities/Usuario';
import { IUsuarioRepository } from '../../domain/auth/repositories/IUsuarioRepository';
import { PerfilAcesso } from '../../domain/auth/value-objects/PerfilAcesso';
import { UniqueID } from '../../domain/shared/UniqueID';
import { PrismaService } from '../database/prisma/prisma.service';

const PRISMA_PARA_DOMINIO: Record<PrismaPerfilAcesso, PerfilAcesso> = {
  [PrismaPerfilAcesso.ADMINISTRADOR]: PerfilAcesso.ADMINISTRADOR,
  [PrismaPerfilAcesso.ATENDENTE]: PerfilAcesso.ATENDENTE,
  [PrismaPerfilAcesso.MECANICO]: PerfilAcesso.MECANICO,
};

const DOMINIO_PARA_PRISMA: Record<PerfilAcesso, PrismaPerfilAcesso> = {
  [PerfilAcesso.ADMINISTRADOR]: PrismaPerfilAcesso.ADMINISTRADOR,
  [PerfilAcesso.ATENDENTE]: PrismaPerfilAcesso.ATENDENTE,
  [PerfilAcesso.MECANICO]: PrismaPerfilAcesso.MECANICO,
};

@Injectable()
export class PrismaUsuarioRepository implements IUsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: PrismaUsuario): Usuario {
    return Usuario.restaurar(
      {
        nome: row.nome,
        email: row.email,
        senha: row.senha,
        perfil: PRISMA_PARA_DOMINIO[row.perfil],
        ativo: row.ativo,
        criadoEm: row.criadoEm,
        atualizadoEm: row.atualizadoEm,
      },
      new UniqueID(row.id),
    );
  }

  async contar(): Promise<number> {
    return this.prisma.usuario.count();
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async salvar(usuario: Usuario): Promise<void> {
    const data = {
      nome: usuario.nome,
      email: usuario.email,
      senha: usuario.senha,
      perfil: DOMINIO_PARA_PRISMA[usuario.perfil],
      ativo: usuario.ativo,
    };
    await this.prisma.usuario.upsert({
      where: { id: usuario.id.toValue() },
      create: { id: usuario.id.toValue(), ...data },
      update: data,
    });
  }
}
