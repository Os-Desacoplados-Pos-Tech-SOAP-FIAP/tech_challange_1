import { UnauthorizedException } from '@nestjs/common';
import { PerfilAcesso as PerfilAcessoPrisma } from '@prisma/client';

import { Usuario } from '../../../domain/auth/entities/Usuario';
import { IUsuarioRepository } from '../../../domain/auth/repositories/IUsuarioRepository';
import { PerfilAcesso } from '../../../domain/auth/value-objects/PerfilAcesso';
import { LoginUseCase } from './LoginUseCase';

class InMemoryUsuarioRepository implements IUsuarioRepository {
  public usuarios: Usuario[] = [];
  async contar() { return this.usuarios.length; }
  async buscarPorEmail(email: string) { return this.usuarios.find((u) => u.email === email) ?? null; }
  async salvar(usuario: Usuario) { this.usuarios.push(usuario); }
}

const makeRepo = (usuario?: Usuario) => {
  const repo = new InMemoryUsuarioRepository();
  if (usuario) repo.usuarios.push(usuario);
  return repo;
};

const makeHashProvider = (matches: boolean) => ({
  hash: jest.fn(),
  compare: jest.fn().mockResolvedValue(matches),
});

const makeJwtService = () => ({
  sign: jest.fn().mockReturnValue('jwt-token'),
});

const adminAtivo = () =>
  Usuario.criar({
    nome: 'Admin',
    email: 'admin@email.com',
    senha: 'hashed',
    perfil: PerfilAcesso.ADMINISTRADOR,
  });

describe('LoginUseCase', () => {
  it('retorna accessToken com credenciais válidas', async () => {
    const useCase = new LoginUseCase(
      makeRepo(adminAtivo()),
      makeJwtService() as any,
      makeHashProvider(true),
    );
    const result = await useCase.execute('admin@email.com', 'senha123');
    expect(result.accessToken).toBe('jwt-token');
    expect(result.usuario.email).toBe('admin@email.com');
    expect(result.usuario.perfil).toBe(PerfilAcessoPrisma.ADMINISTRADOR);
  });

  it('lança UnauthorizedException para usuário inexistente', async () => {
    const useCase = new LoginUseCase(
      makeRepo(),
      makeJwtService() as any,
      makeHashProvider(false),
    );
    await expect(useCase.execute('x@y.com', 'senha')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lança UnauthorizedException para usuário inativo', async () => {
    const inativo = Usuario.restaurar(
      {
        nome: 'Admin',
        email: 'admin@email.com',
        senha: 'hashed',
        perfil: PerfilAcesso.ADMINISTRADOR,
        ativo: false,
      },
      adminAtivo().id,
    );
    const useCase = new LoginUseCase(
      makeRepo(inativo),
      makeJwtService() as any,
      makeHashProvider(true),
    );
    await expect(useCase.execute('admin@email.com', 'senha')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lança UnauthorizedException para senha incorreta', async () => {
    const useCase = new LoginUseCase(
      makeRepo(adminAtivo()),
      makeJwtService() as any,
      makeHashProvider(false),
    );
    await expect(useCase.execute('admin@email.com', 'errada')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
