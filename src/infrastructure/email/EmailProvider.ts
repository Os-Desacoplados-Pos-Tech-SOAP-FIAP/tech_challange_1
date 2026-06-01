import { Injectable, Logger } from '@nestjs/common';

/** Mensagem de email a ser entregue por um {@link EmailProvider}. */
export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

/**
 * Ponto de extensão para o envio de emails (ex.: notificação de orçamento ao cliente).
 *
 * É a única abstração que as camadas `application`/`infrastructure` conhecem: elas
 * dependem do token de DI `INJECTION_TOKENS.EMAIL_PROVIDER`, nunca de uma
 * implementação concreta. Trocar o provider em produção **não exige mudança em
 * domain/application** — basta substituir o binding em `InfrastructureModule`.
 *
 * @remarks
 * Hoje o binding aponta para {@link ConsoleEmailProvider} (mock que só loga).
 * Para integrar um provider real (SMTP, AWS SES, etc.):
 * 1. Crie uma classe que implemente esta interface (ex.: `SesEmailProvider`),
 *    lendo credenciais/endpoint de variáveis de ambiente.
 * 2. Em `src/infrastructure/infrastructure.module.ts`, troque o provider do token
 *    `EMAIL_PROVIDER` — por exemplo via `useClass` condicionado a uma env
 *    (`EMAIL_PROVIDER=ses` → `SesEmailProvider`; caso contrário, `ConsoleEmailProvider`).
 *
 * @example
 * ```ts
 * {
 *   provide: INJECTION_TOKENS.EMAIL_PROVIDER,
 *   useClass: process.env.EMAIL_PROVIDER === 'ses' ? SesEmailProvider : ConsoleEmailProvider,
 * }
 * ```
 */
export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Implementação mock usada na Fase 2: apenas registra a mensagem no log da aplicação.
 *
 * Mantida intencionalmente sem integração externa. Veja {@link EmailProvider} para
 * a estratégia de substituição por um provider real em produção.
 */
@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger('Email');

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(
      `---\nTO: ${message.to}\nSUBJECT: ${message.subject}\n${message.body}\n---`,
    );
  }
}
