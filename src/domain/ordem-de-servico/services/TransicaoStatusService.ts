import { StatusOS, StatusOSEnum } from '../value-objects/StatusOS';

export class TransicaoStatusService {
  public transicionar(statusAtual: StatusOS, novoStatus: StatusOSEnum): StatusOS {
    return statusAtual.transicionar(novoStatus);
  }

  public pode(statusAtual: StatusOS, novoStatus: StatusOSEnum): boolean {
    return statusAtual.podeTransicionarPara(novoStatus);
  }
}
