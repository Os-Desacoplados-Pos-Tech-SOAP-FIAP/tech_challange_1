import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PerfilAcesso as PerfilAcessoPrisma } from '@prisma/client';

import { Usuario } from '../../../domain/auth/entities/Usuario';
import { IUsuarioRepository } from '../../../domain/auth/repositories/IUsuarioRepository';
import { PerfilAcesso } from '../../../domain/auth/value-objects/PerfilAcesso';
import { RegistrarUsuarioUseCase } from './RegistrarUsuarioUseCase';

class InMemoryUsuarioRepository implements IUsuarioRepository {
  public usuarios: Usuario[] = [];
  async contar() { return this.usuarios.length; }
  async buscarPorEmail(email: string) { return this.usuarios.find((u) => u.email === email) ?? null; }
  async salvar(usuario: Usuario) { this.usuarios.push(usuario); }
}

const seedUsuario = (email = 'existente@email.com') =>
  Usuario.criar({ nome: 'Existente', email, senha: 'hashed', perfil: PerfilAcesso.ATENDENTE });

const makeHashProvider = () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn(),
});

const input = {
  nome: 'Novo Usuário',
  email: 'novo@email.com',
  senha: 'senha123',
  perfil: PerfilAcessoPrisma.ATENDENTE,
};

describe('RegistrarUsuarioUseCase', () => {
  it('registra primeiro usuário sem autenticação', async () => {
    const repo = new InMemoryUsuarioRepository();
    const useCase = new RegistrarUsuarioUseCase(repo, makeHashProvider());
    const result = await useCase.execute(input);
    expect(result.email).toBe('novo@email.com');
    expect(result.perfil).toBe(PerfilAcessoPrisma.ATENDENTE);
    expect(repo.usuarios).toHaveLength(1);
  });

  it('lança ForbiddenException se não for admin registrando depois do primeiro', async () => {
    const repo = new InMemoryUsuarioRepository();
    repo.usuarios.push(seedUsuario());
    const useCase = new RegistrarUsuarioUseCase(repo, makeHashProvider());
    await expect(useCase.execute({ ...input, solicitantePerfil: PerfilAcessoPrisma.MECANICO }))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin pode registrar novo usuário', async () => {
    const repo = new InMemoryUsuarioRepository();
    repo.usuarios.push(seedUsuario());
    const useCase = new RegistrarUsuarioUseCase(repo, makeHashProvider());
    const result = await useCase.execute({ ...input, solicitantePerfil: PerfilAcessoPrisma.ADMINISTRADOR });
    expect(result.email).toBe('novo@email.com');
  });

  it('lança ConflictException para email duplicado', async () => {
    const repo = new InMemoryUsuarioRepository();
    repo.usuarios.push(seedUsuario('novo@email.com'));
    const useCase = new RegistrarUsuarioUseCase(repo, makeHashProvider());
    await expect(useCase.execute({ ...input, solicitantePerfil: PerfilAcessoPrisma.ADMINISTRADOR }))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('lança BadRequestException para dados ausentes', async () => {
    const repo = new InMemoryUsuarioRepository();
    const useCase = new RegistrarUsuarioUseCase(repo, makeHashProvider());
    await expect(useCase.execute({ nome: '', email: '', senha: '', perfil: PerfilAcessoPrisma.ATENDENTE }))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});
