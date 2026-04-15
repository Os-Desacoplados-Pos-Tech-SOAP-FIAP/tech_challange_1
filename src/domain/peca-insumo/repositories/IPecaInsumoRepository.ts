import { UniqueID } from '../../shared/UniqueID';
import { PecaInsumo } from '../entities/PecaInsumo';

export interface IPecaInsumoRepository {
  salvar(peca: PecaInsumo): Promise<void>;
  buscarPorId(id: UniqueID): Promise<PecaInsumo | null>;
  buscarPorCodigo(codigo: string): Promise<PecaInsumo | null>;
  listar(): Promise<PecaInsumo[]>;
  remover(id: UniqueID): Promise<void>;
}
