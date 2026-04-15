import { UniqueID } from '../../shared/UniqueID';
import { OrdemDeServico } from '../entities/OrdemDeServico';

export interface IOrdemDeServicoRepository {
  salvar(os: OrdemDeServico): Promise<void>;
  buscarPorId(id: UniqueID): Promise<OrdemDeServico | null>;
  buscarPorNumero(numero: number): Promise<OrdemDeServico | null>;
  listar(): Promise<OrdemDeServico[]>;
  proximoNumero(): Promise<number>;
  tempoMedioExecucaoMinutos(): Promise<number>;
}
