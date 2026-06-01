import { DomainError } from '../../shared/DomainError';
import { UniqueID } from '../../shared/UniqueID';
import { PerfilAcesso } from '../value-objects/PerfilAcesso';
import { Usuario } from './Usuario';

describe('Usuario', () => {
  it('cria usuário ativo com dados normalizados', () => {
    const usuario = Usuario.criar({
      nome: '  Maria  ',
      email: '  maria@email.com  ',
      senha: 'hash',
      perfil: PerfilAcesso.ATENDENTE,
    });
    expect(usuario.nome).toBe('Maria');
    expect(usuario.email).toBe('maria@email.com');
    expect(usuario.senha).toBe('hash');
    expect(usuario.perfil).toBe(PerfilAcesso.ATENDENTE);
    expect(usuario.ativo).toBe(true);
  });

  it.each([
    ['nome', { nome: '', email: 'a@b.com', senha: 'h' }],
    ['email', { nome: 'Ana', email: '', senha: 'h' }],
    ['senha', { nome: 'Ana', email: 'a@b.com', senha: '' }],
  ])('lança DomainError quando %s está ausente', (_campo, dados) => {
    expect(() =>
      Usuario.criar({ ...dados, perfil: PerfilAcesso.MECANICO } as never),
    ).toThrow(DomainError);
  });

  it('restaura usuário preservando id e estado', () => {
    const id = new UniqueID();
    const usuario = Usuario.restaurar(
      {
        nome: 'Carlos',
        email: 'carlos@email.com',
        senha: 'hash',
        perfil: PerfilAcesso.ADMINISTRADOR,
        ativo: false,
      },
      id,
    );
    expect(usuario.id.equals(id)).toBe(true);
    expect(usuario.ativo).toBe(false);
    expect(usuario.perfil).toBe(PerfilAcesso.ADMINISTRADOR);
  });
});
