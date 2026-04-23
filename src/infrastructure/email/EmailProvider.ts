import { Injectable, Logger } from '@nestjs/common';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger('Email');

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(
      `---\nTO: ${message.to}\nSUBJECT: ${message.subject}\n${message.body}\n---`,
    );
  }
}
