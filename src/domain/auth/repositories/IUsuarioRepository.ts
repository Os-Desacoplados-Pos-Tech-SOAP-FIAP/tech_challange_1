import { Usuario } from '../entities/Usuario';

export interface IUsuarioRepository {
  contar(): Promise<number>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  salvar(usuario: Usuario): Promise<void>;
}
