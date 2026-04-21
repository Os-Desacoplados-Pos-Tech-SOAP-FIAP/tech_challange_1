import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PerfilAcesso } from '@prisma/client';

import { RegistrarUsuarioUseCase } from './RegistrarUsuarioUseCase';

const makeUsuarioCriado = (overrides = {}) => ({
  id: 'new-id',
  nome: 'Novo',
  email: 'novo@email.com',
  perfil: PerfilAcesso.ATENDENTE,
  ...overrides,
});

const makePrisma = (count: number, existente: object | null, criado = makeUsuarioCriado()) => ({
  usuario: {
    count: jest.fn().mockResolvedValue(count),
    findUnique: jest.fn().mockResolvedValue(existente),
    create: jest.fn().mockResolvedValue(criado),
  },
});

const makeHashProvider = () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn(),
});

const input = {
  nome: 'Novo Usuário',
  email: 'novo@email.com',
  senha: 'senha123',
  perfil: PerfilAcesso.ATENDENTE,
};

describe('RegistrarUsuarioUseCase', () => {
  it('registra primeiro usuário sem autenticação', async () => {
    const prisma = makePrisma(0, null);
    const useCase = new RegistrarUsuarioUseCase(prisma as any, makeHashProvider());
    const result = await useCase.execute(input);
    expect(result.email).toBe('novo@email.com');
  });

  it('lança ForbiddenException se não for admin registrando depois do primeiro', async () => {
    const prisma = makePrisma(1, null);
    const useCase = new RegistrarUsuarioUseCase(prisma as any, makeHashProvider());
    await expect(useCase.execute({ ...input, solicitantePerfil: PerfilAcesso.MECANICO }))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin pode registrar novo usuário', async () => {
    const prisma = makePrisma(1, null);
    const useCase = new RegistrarUsuarioUseCase(prisma as any, makeHashProvider());
    const result = await useCase.execute({ ...input, solicitantePerfil: PerfilAcesso.ADMINISTRADOR });
    expect(result.email).toBe('novo@email.com');
  });

  it('lança ConflictException para email duplicado', async () => {
    const prisma = makePrisma(1, makeUsuarioCriado());
    const useCase = new RegistrarUsuarioUseCase(prisma as any, makeHashProvider());
    await expect(useCase.execute({ ...input, solicitantePerfil: PerfilAcesso.ADMINISTRADOR }))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('lança BadRequestException para dados ausentes', async () => {
    const prisma = makePrisma(0, null);
    const useCase = new RegistrarUsuarioUseCase(prisma as any, makeHashProvider());
    await expect(useCase.execute({ nome: '', email: '', senha: '', perfil: PerfilAcesso.ATENDENTE }))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});
