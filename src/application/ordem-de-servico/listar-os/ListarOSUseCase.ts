import { Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { StatusOSEnum } from '../../../domain/ordem-de-servico/value-objects/StatusOSEnum';

const PESO_STATUS: Record<StatusOSEnum, number> = {
  [StatusOSEnum.EM_EXECUCAO]: 1,
  [StatusOSEnum.AGUARDANDO_APROVACAO]: 2,
  [StatusOSEnum.EM_DIAGNOSTICO]: 3,
  [StatusOSEnum.RECEBIDA]: 4,
  [StatusOSEnum.APROVADA]: 5,
  [StatusOSEnum.REPROVADA]: 6,
  [StatusOSEnum.FINALIZADA]: Number.MAX_SAFE_INTEGER,
  [StatusOSEnum.ENTREGUE]: Number.MAX_SAFE_INTEGER,
};

const STATUS_OCULTOS: ReadonlySet<StatusOSEnum> = new Set([
  StatusOSEnum.FINALIZADA,
  StatusOSEnum.ENTREGUE,
]);

@Injectable()
export class ListarOSUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
  ) {}

  async execute(): Promise<OrdemDeServico[]> {
    const todas = await this.osRepository.listar();
    return todas
      .filter((os) => !STATUS_OCULTOS.has(os.status.value))
      .sort((a, b) => {
        const pesoA = PESO_STATUS[a.status.value];
        const pesoB = PESO_STATUS[b.status.value];
        if (pesoA !== pesoB) return pesoA - pesoB;
        return a.criadoEm.getTime() - b.criadoEm.getTime();
      });
  }

  async tempoMedioExecucao(): Promise<number> {
    return this.osRepository.tempoMedioExecucaoMinutos();
  }
}
