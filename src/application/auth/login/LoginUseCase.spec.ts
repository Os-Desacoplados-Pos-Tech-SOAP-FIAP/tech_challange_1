import { UnauthorizedException } from '@nestjs/common';
import { PerfilAcesso } from '@prisma/client';

import { LoginUseCase } from './LoginUseCase';

const makeUsuario = (overrides = {}) => ({
  id: 'user-id',
  nome: 'Admin',
  email: 'admin@email.com',
  senha: 'hashed',
  perfil: PerfilAcesso.ADMINISTRADOR,
  ativo: true,
  ...overrides,
});

const makePrisma = (usuario: object | null) => ({
  usuario: {
    findUnique: jest.fn().mockResolvedValue(usuario),
  },
});

const makeHashProvider = (matches: boolean) => ({
  hash: jest.fn(),
  compare: jest.fn().mockResolvedValue(matches),
});

const makeJwtService = () => ({
  sign: jest.fn().mockReturnValue('jwt-token'),
});

describe('LoginUseCase', () => {
  it('retorna accessToken com credenciais válidas', async () => {
    const useCase = new LoginUseCase(
      makePrisma(makeUsuario()) as any,
      makeJwtService() as any,
      makeHashProvider(true),
    );
    const result = await useCase.execute('admin@email.com', 'senha123');
    expect(result.accessToken).toBe('jwt-token');
    expect(result.usuario.email).toBe('admin@email.com');
  });

  it('lança UnauthorizedException para usuário inexistente', async () => {
    const useCase = new LoginUseCase(
      makePrisma(null) as any,
      makeJwtService() as any,
      makeHashProvider(false),
    );
    await expect(useCase.execute('x@y.com', 'senha')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lança UnauthorizedException para usuário inativo', async () => {
    const useCase = new LoginUseCase(
      makePrisma(makeUsuario({ ativo: false })) as any,
      makeJwtService() as any,
      makeHashProvider(true),
    );
    await expect(useCase.execute('admin@email.com', 'senha')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lança UnauthorizedException para senha incorreta', async () => {
    const useCase = new LoginUseCase(
      makePrisma(makeUsuario()) as any,
      makeJwtService() as any,
      makeHashProvider(false),
    );
    await expect(useCase.execute('admin@email.com', 'errada')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
