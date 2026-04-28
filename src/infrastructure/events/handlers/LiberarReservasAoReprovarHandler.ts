import { Inject, Injectable, Logger } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { EstoqueReservaLiberada } from '../../../domain/insumo/events/EstoqueReservaLiberada';
import { IInsumoRepository } from '../../../domain/insumo/repositories/IInsumoRepository';
import { TipoItemOrcamento } from '../../../domain/ordem-de-servico/entities/ItemOrcamento';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { DomainEvent } from '../../../domain/shared/DomainEvent';
import { EVENTS } from '../../../domain/shared/events/EventNames';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { OnDomainEvent } from '../OnDomainEvent.decorator';

@Injectable()
export class LiberarReservasAoReprovarHandler {
  private readonly logger = new Logger(LiberarReservasAoReprovarHandler.name);

  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
    @Inject(INJECTION_TOKENS.INSUMO_REPOSITORY)
    private readonly insumoRepository: IInsumoRepository,
  ) {}

  @OnDomainEvent(EVENTS.OS_ORCAMENTO_RECUSADO)
  async onReprovada(event: DomainEvent): Promise<void> {
    const os = await this.osRepository.buscarPorId(event.aggregateId);
    if (!os) return;
    const insumos = os.itensOrcamento.filter((i) => i.tipo === TipoItemOrcamento.INSUMO);
    for (const item of insumos) {
      const insumo = await this.insumoRepository.buscarPorId(
        new UniqueID(item.referenciaId.toValue()),
      );
      if (!insumo) continue;
      try {
        insumo.liberarReserva(item.quantidade);
        insumo.addDomainEvent(new EstoqueReservaLiberada(insumo.id, item.quantidade));
        await this.insumoRepository.salvar(insumo);
      } catch (err) {
        this.logger.error(
          `Falha ao liberar reserva de ${item.quantidade}x insumo ${insumo.id.toValue()}: ${(err as Error).message}`,
        );
      }
    }
  }
}
