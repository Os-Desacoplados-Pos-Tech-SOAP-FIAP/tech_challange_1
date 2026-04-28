import { Injectable } from '@nestjs/common';
import {
  ExecucaoDeServico as PrismaExecucao,
  ItemOrcamento as PrismaItemOrcamento,
  OrdemDeServico as PrismaOS,
  StatusOS as PrismaStatusOS,
  TipoItemOrcamento as PrismaTipoItemOrcamento,
} from '@prisma/client';

import {
  ExecucaoDeServico,
  ExecucaoDeServicoProps,
} from '../../domain/ordem-de-servico/entities/ExecucaoDeServico';
import {
  ItemOrcamento,
  TipoItemOrcamento,
} from '../../domain/ordem-de-servico/entities/ItemOrcamento';
import { OrdemDeServico } from '../../domain/ordem-de-servico/entities/OrdemDeServico';
import {
  IOrdemDeServicoRepository,
  TempoMedioPorServicoRow,
} from '../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { NumeroOS } from '../../domain/ordem-de-servico/value-objects/NumeroOS';
import { StatusOS, StatusOSEnum } from '../../domain/ordem-de-servico/value-objects/StatusOS';
import { UniqueID } from '../../domain/shared/UniqueID';
import { PrismaService } from '../database/prisma/prisma.service';
import { EventDispatcher } from '../events/EventDispatcher';

type PrismaOSCompleta = PrismaOS & {
  itensOrcamento: PrismaItemOrcamento[];
  execucoes: PrismaExecucao[];
};

@Injectable()
export class PrismaOrdemDeServicoRepository implements IOrdemDeServicoRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  private toDomain(row: PrismaOSCompleta): OrdemDeServico {
    const itens = row.itensOrcamento.map((i) =>
      ItemOrcamento.restaurar(
        {
          tipo:
            i.tipo === PrismaTipoItemOrcamento.SERVICO
              ? TipoItemOrcamento.SERVICO
              : TipoItemOrcamento.INSUMO,
          referenciaId: new UniqueID(i.referenciaId),
          descricao: i.descricao,
          quantidade: i.quantidade,
          valorUnitario: Number(i.valorUnitario),
          criadoEm: i.criadoEm,
          atualizadoEm: i.criadoEm,
        },
        new UniqueID(i.id),
      ),
    );

    const execucoes = row.execucoes.map((e) => {
      const props: ExecucaoDeServicoProps = {
        itemOrcamentoId: new UniqueID(e.itemOrcamentoId),
        servicoId: new UniqueID(e.servicoId),
        mecanicoId: new UniqueID(e.mecanicoId),
        inicio: e.inicio,
        fim: e.fim ?? undefined,
        criadoEm: e.criadoEm,
        atualizadoEm: e.criadoEm,
      };
      return ExecucaoDeServico.restaurar(props, new UniqueID(e.id));
    });

    return OrdemDeServico.restaurar(
      {
        numero: NumeroOS.create(row.numero),
        clienteId: new UniqueID(row.clienteId),
        veiculoId: new UniqueID(row.veiculoId),
        status: StatusOS.create(row.status as StatusOSEnum),
        itensOrcamento: itens,
        execucoes,
        observacoes: row.observacoes ?? undefined,
        criadoEm: row.criadoEm,
        atualizadoEm: row.atualizadoEm,
      },
      new UniqueID(row.id),
    );
  }

  async salvar(os: OrdemDeServico): Promise<void> {
    const osId = os.id.toValue();
    await this.prisma.$transaction(async (tx) => {
      await tx.ordemDeServico.upsert({
        where: { id: osId },
        create: {
          id: osId,
          numero: os.numero.value,
          clienteId: os.clienteId.toValue(),
          veiculoId: os.veiculoId.toValue(),
          status: os.status.value as PrismaStatusOS,
          valorEstimado: os.valorEstimado.value,
          observacoes: os.observacoes ?? null,
        },
        update: {
          status: os.status.value as PrismaStatusOS,
          valorEstimado: os.valorEstimado.value,
          observacoes: os.observacoes ?? null,
        },
      });

      const itemIds = os.itensOrcamento.map((i) => i.id.toValue());
      await tx.itemOrcamento.deleteMany({
        where: {
          ordemDeServicoId: osId,
          ...(itemIds.length > 0 ? { id: { notIn: itemIds } } : {}),
        },
      });
      for (const item of os.itensOrcamento) {
        await tx.itemOrcamento.upsert({
          where: { id: item.id.toValue() },
          create: {
            id: item.id.toValue(),
            ordemDeServicoId: osId,
            tipo:
              item.tipo === TipoItemOrcamento.SERVICO
                ? PrismaTipoItemOrcamento.SERVICO
                : PrismaTipoItemOrcamento.INSUMO,
            referenciaId: item.referenciaId.toValue(),
            descricao: item.descricao,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            valorTotal: item.valorTotal,
          },
          update: {
            descricao: item.descricao,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            valorTotal: item.valorTotal,
          },
        });
      }

      for (const execucao of os.execucoes) {
        const execId = execucao.id.toValue();
        await tx.execucaoDeServico.upsert({
          where: { id: execId },
          create: {
            id: execId,
            ordemDeServicoId: osId,
            itemOrcamentoId: execucao.itemOrcamentoId.toValue(),
            servicoId: execucao.servicoId.toValue(),
            mecanicoId: execucao.mecanicoId.toValue(),
            inicio: execucao.inicio,
            fim: execucao.fim ?? null,
            tempoExecucaoMinutos: execucao.tempoExecucaoMinutos ?? null,
          },
          update: {
            fim: execucao.fim ?? null,
            tempoExecucaoMinutos: execucao.tempoExecucaoMinutos ?? null,
          },
        });
      }
    });
    await this.eventDispatcher.publish(os.pullEvents());
  }

  async buscarPorId(id: UniqueID): Promise<OrdemDeServico | null> {
    const row = await this.prisma.ordemDeServico.findUnique({
      where: { id: id.toValue() },
      include: {
        itensOrcamento: true,
        execucoes: true,
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async buscarPorNumero(numero: number): Promise<OrdemDeServico | null> {
    const row = await this.prisma.ordemDeServico.findUnique({
      where: { numero },
      include: {
        itensOrcamento: true,
        execucoes: true,
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async buscarPorItemOrcamentoId(itemOrcamentoId: UniqueID): Promise<OrdemDeServico | null> {
    const row = await this.prisma.ordemDeServico.findFirst({
      where: { itensOrcamento: { some: { id: itemOrcamentoId.toValue() } } },
      include: {
        itensOrcamento: true,
        execucoes: true,
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async listar(): Promise<OrdemDeServico[]> {
    const rows = await this.prisma.ordemDeServico.findMany({
      include: {
        itensOrcamento: true,
        execucoes: true,
      },
      orderBy: { criadoEm: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async proximoNumero(): Promise<number> {
    const last = await this.prisma.ordemDeServico.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    return (last?.numero ?? 0) + 1;
  }

  async tempoMedioExecucaoMinutos(): Promise<number> {
    const result = await this.prisma.execucaoDeServico.aggregate({
      _avg: { tempoExecucaoMinutos: true },
      where: {
        tempoExecucaoMinutos: { not: null },
        ordemDeServico: { status: { in: ['FINALIZADA', 'ENTREGUE'] } },
      },
    });
    return Math.round(result._avg.tempoExecucaoMinutos ?? 0);
  }

  async tempoMedioExecucaoPorServico(): Promise<TempoMedioPorServicoRow[]> {
    const rows = await this.prisma.execucaoDeServico.groupBy({
      by: ['servicoId'],
      where: {
        tempoExecucaoMinutos: { not: null },
        ordemDeServico: { status: { in: ['FINALIZADA', 'ENTREGUE'] } },
      },
      _avg: { tempoExecucaoMinutos: true },
      _count: { _all: true },
    });
    return rows.map((r) => ({
      servicoId: r.servicoId,
      tempoMedioMinutos: Math.round(r._avg.tempoExecucaoMinutos ?? 0),
      totalExecucoes: r._count._all,
    }));
  }
}
