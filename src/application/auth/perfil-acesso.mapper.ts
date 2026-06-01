import { PerfilAcesso as PerfilAcessoPrisma } from '@prisma/client';

import { PerfilAcesso } from '../../domain/auth/value-objects/PerfilAcesso';

const PRISMA_PARA_DOMINIO: Record<PerfilAcessoPrisma, PerfilAcesso> = {
  [PerfilAcessoPrisma.ADMINISTRADOR]: PerfilAcesso.ADMINISTRADOR,
  [PerfilAcessoPrisma.ATENDENTE]: PerfilAcesso.ATENDENTE,
  [PerfilAcessoPrisma.MECANICO]: PerfilAcesso.MECANICO,
};

const DOMINIO_PARA_PRISMA: Record<PerfilAcesso, PerfilAcessoPrisma> = {
  [PerfilAcesso.ADMINISTRADOR]: PerfilAcessoPrisma.ADMINISTRADOR,
  [PerfilAcesso.ATENDENTE]: PerfilAcessoPrisma.ATENDENTE,
  [PerfilAcesso.MECANICO]: PerfilAcessoPrisma.MECANICO,
};

export const perfilParaDominio = (perfil: PerfilAcessoPrisma): PerfilAcesso =>
  PRISMA_PARA_DOMINIO[perfil];

export const perfilParaPrisma = (perfil: PerfilAcesso): PerfilAcessoPrisma =>
  DOMINIO_PARA_PRISMA[perfil];
