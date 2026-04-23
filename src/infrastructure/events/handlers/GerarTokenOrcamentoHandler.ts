import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { IOrcamentoTokenRepository } from '../../../domain/ordem-de-servico/repositories/IOrcamentoTokenRepository';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { DomainEvent } from '../../../domain/shared/DomainEvent';
import { EVENTS } from '../../../domain/shared/events/EventNames';
import { EmailProvider } from '../../email/EmailProvider';
import { OnDomainEvent } from '../OnDomainEvent.decorator';

@Injectable()
export class GerarTokenOrcamentoHandler {
  private readonly logger = new Logger(GerarTokenOrcamentoHandler.name);

  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
    @Inject(INJECTION_TOKENS.CLIENTE_REPOSITORY)
    private readonly clienteRepository: IClienteRepository,
    @Inject(INJECTION_TOKENS.ORCAMENTO_TOKEN_REPOSITORY)
    private readonly tokenRepository: IOrcamentoTokenRepository,
    @Inject(INJECTION_TOKENS.EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider,
  ) {}

  @OnDomainEvent(EVENTS.OS_ORCAMENTO_ENVIADO)
  async onOrcamentoEnviado(event: DomainEvent): Promise<void> {
    const os = await this.osRepository.buscarPorId(event.aggregateId);
    if (!os) return;
    const cliente = await this.clienteRepository.buscarPorId(os.clienteId);
    if (!cliente) {
      this.logger.warn(`Cliente ${os.clienteId.toValue()} não encontrado para OS ${os.id.toValue()}`);
      return;
    }

    const token = uuid();
    await this.tokenRepository.criar(os.id.toValue(), token);

    const link = `/api/publico/os/${os.numero.value}/orcamento?token=${token}`;
    await this.emailProvider.send({
      to: cliente.email.value,
      subject: `Orçamento da OS #${os.numero.value} disponível para aprovação`,
      body:
        `Olá ${cliente.nome},\n\n` +
        `Seu orçamento está pronto. Acesse o link abaixo para aprovar ou reprovar:\n` +
        `${link}\n\n` +
        `Valor estimado: R$ ${os.valorEstimado.value.toFixed(2)}\n\n` +
        `Este link é de uso único.`,
    });
  }
}
