import { Injectable, Optional } from '@nestjs/common';
import { Counter, Histogram, metrics } from '@opentelemetry/api';

import { DomainEvent } from '../../../domain/shared/DomainEvent';
import { EVENTS } from '../../../domain/shared/events/EventNames';
import { OnDomainEvent } from '../OnDomainEvent.decorator';

/** Fronteira fina com o OTel — mantém o handler testável sem SDK de telemetria. */
export interface EmissorDeMetricas {
  incrementar(nome: string): void;
  registrarDuracao(etapa: string, segundos: number): void;
}

class OtelEmissor implements EmissorDeMetricas {
  private readonly meter = metrics.getMeter('oficina-negocio');
  private readonly contadores = new Map<string, Counter>();
  private readonly duracao: Histogram = this.meter.createHistogram(
    'os_etapa_duracao_segundos',
    { description: 'Tempo decorrido entre transições de status da Ordem de Serviço' },
  );

  public incrementar(nome: string): void {
    let contador = this.contadores.get(nome);
    if (!contador) {
      contador = this.meter.createCounter(nome);
      this.contadores.set(nome, contador);
    }
    contador.add(1);
  }

  public registrarDuracao(etapa: string, segundos: number): void {
    this.duracao.record(segundos, { etapa });
  }
}

/**
 * Traduz domain events em métricas de negócio (volume de OS por etapa e tempo
 * médio entre transições) sem qualquer mudança nas camadas domain/application.
 *
 * O mapa de transições vive em memória por pod: o tempo é medido apenas quando
 * as duas pontas da transição caem no mesmo processo. É uma aproximação aceita
 * para o MVP — registrada no ADR de observabilidade.
 */
@Injectable()
export class MetricasDeNegocioHandler {
  private readonly ultimaTransicao = new Map<string, { etapa: string; em: number }>();

  // @Optional(): o emissor não é um provider do container — em produção usamos o
  // default (OTel) e os testes injetam um duble.
  constructor(@Optional() private readonly emissor: EmissorDeMetricas = new OtelEmissor()) {}

  @OnDomainEvent(EVENTS.OS_CRIADA)
  public onOsCriada(event: DomainEvent): void {
    this.emissor.incrementar('os_criadas_total');
    this.marcar(event, 'RECEBIDA');
  }

  @OnDomainEvent(EVENTS.OS_DIAGNOSTICO_CONCLUIDO)
  public onDiagnosticoConcluido(event: DomainEvent): void {
    this.emissor.incrementar('os_diagnosticos_total');
    this.medir(event, 'RECEBIDA_ATE_DIAGNOSTICO', 'DIAGNOSTICO');
  }

  @OnDomainEvent(EVENTS.OS_ORCAMENTO_APROVADO)
  public onAprovado(event: DomainEvent): void {
    this.emissor.incrementar('os_orcamentos_aprovados_total');
    this.medir(event, 'DIAGNOSTICO_ATE_APROVACAO', 'APROVADA');
  }

  @OnDomainEvent(EVENTS.OS_ORCAMENTO_RECUSADO)
  public onRecusado(_event: DomainEvent): void {
    this.emissor.incrementar('os_orcamentos_recusados_total');
  }

  @OnDomainEvent(EVENTS.OS_FINALIZADA)
  public onFinalizada(event: DomainEvent): void {
    this.emissor.incrementar('os_finalizadas_total');
    this.medir(event, 'APROVACAO_ATE_FINALIZACAO', 'FINALIZADA');
  }

  @OnDomainEvent(EVENTS.OS_ENTREGUE)
  public onEntregue(event: DomainEvent): void {
    this.emissor.incrementar('os_entregues_total');
    this.medir(event, 'FINALIZACAO_ATE_ENTREGA', 'ENTREGUE');
  }

  private marcar(event: DomainEvent, etapa: string): void {
    this.ultimaTransicao.set(event.aggregateId.toValue(), {
      etapa,
      em: event.ocorridoEm.getTime(),
    });
  }

  private medir(event: DomainEvent, nomeEtapa: string, novaEtapa: string): void {
    const anterior = this.ultimaTransicao.get(event.aggregateId.toValue());
    if (anterior) {
      this.emissor.registrarDuracao(
        nomeEtapa,
        (event.ocorridoEm.getTime() - anterior.em) / 1000,
      );
    }
    this.marcar(event, novaEtapa);
  }
}
