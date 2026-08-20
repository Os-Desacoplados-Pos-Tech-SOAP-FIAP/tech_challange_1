import { randomUUID } from 'crypto';

import { UniqueID } from '../../../domain/shared/UniqueID';
import { BaseDomainEvent } from '../../../domain/shared/DomainEvent';
import { EVENTS } from '../../../domain/shared/events/EventNames';
import { EmissorDeMetricas, MetricasDeNegocioHandler } from './MetricasDeNegocioHandler';

class EventoFake extends BaseDomainEvent {
  constructor(aggregateId: string, name: symbol, ocorridoEm?: Date) {
    super(new UniqueID(aggregateId), name, String(name));
    if (ocorridoEm) {
      (this as { ocorridoEm: Date }).ocorridoEm = ocorridoEm;
    }
  }
}

const ids = {
  os_1: randomUUID(),
  os_2: randomUUID(),
  os_3: randomUUID(),
  os_orfa: randomUUID(),
};

describe('MetricasDeNegocioHandler', () => {
  let emissor: jest.Mocked<EmissorDeMetricas>;
  let handler: MetricasDeNegocioHandler;

  beforeEach(() => {
    emissor = { incrementar: jest.fn(), registrarDuracao: jest.fn() };
    handler = new MetricasDeNegocioHandler(emissor);
  });

  it('conta OS criadas', () => {
    handler.onOsCriada(new EventoFake(ids.os_1, EVENTS.OS_CRIADA));
    expect(emissor.incrementar).toHaveBeenCalledWith('os_criadas_total');
  });

  it('registra a duração entre criação e diagnóstico da mesma OS', () => {
    const criacao = new Date('2026-08-19T10:00:00Z');
    const diagnostico = new Date('2026-08-19T10:05:00Z');
    handler.onOsCriada(new EventoFake(ids.os_1, EVENTS.OS_CRIADA, criacao));
    handler.onDiagnosticoConcluido(
      new EventoFake(ids.os_1, EVENTS.OS_DIAGNOSTICO_CONCLUIDO, diagnostico),
    );
    expect(emissor.registrarDuracao).toHaveBeenCalledWith('RECEBIDA_ATE_DIAGNOSTICO', 300);
  });

  it('não registra duração quando não há transição anterior conhecida', () => {
    handler.onFinalizada(new EventoFake(ids.os_orfa, EVENTS.OS_FINALIZADA));
    expect(emissor.registrarDuracao).not.toHaveBeenCalled();
    expect(emissor.incrementar).toHaveBeenCalledWith('os_finalizadas_total');
  });

  it('conta aprovações, recusas e entregas', () => {
    handler.onAprovado(new EventoFake(ids.os_2, EVENTS.OS_ORCAMENTO_APROVADO));
    handler.onRecusado(new EventoFake(ids.os_3, EVENTS.OS_ORCAMENTO_RECUSADO));
    handler.onEntregue(new EventoFake(ids.os_2, EVENTS.OS_ENTREGUE));
    expect(emissor.incrementar).toHaveBeenCalledWith('os_orcamentos_aprovados_total');
    expect(emissor.incrementar).toHaveBeenCalledWith('os_orcamentos_recusados_total');
    expect(emissor.incrementar).toHaveBeenCalledWith('os_entregues_total');
  });
});
