import { Injectable } from '@nestjs/common';

import {
  IOrcamentoTokenRepository,
  OrcamentoTokenRecord,
} from '../../domain/ordem-de-servico/repositories/IOrcamentoTokenRepository';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class PrismaOrcamentoTokenRepository implements IOrcamentoTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(ordemDeServicoId: string, token: string): Promise<OrcamentoTokenRecord> {
    return this.prisma.orcamentoToken.create({
      data: { ordemDeServicoId, token },
    });
  }

  async buscarPorToken(token: string): Promise<OrcamentoTokenRecord | null> {
    return this.prisma.orcamentoToken.findUnique({ where: { token } });
  }

  async marcarComoUsado(id: string): Promise<void> {
    await this.prisma.orcamentoToken.update({
      where: { id },
      data: { usado: true, usadoEm: new Date() },
    });
  }
}
