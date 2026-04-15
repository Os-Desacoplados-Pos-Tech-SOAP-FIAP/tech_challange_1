import { Injectable } from '@nestjs/common';
import {
  ExecucaoDeServico as PrismaExecucao,
  ItemOrcamento as PrismaItemOrcamento,
  OrdemDeServico as PrismaOS,
  PecaUtilizada as PrismaPecaUtilizada,
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
import { IOrdemDeServicoRepository } from '../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { NumeroOS } from '../../domain/ordem-de-servico/value-objects/NumeroOS';
import { StatusOS, StatusOSEnum } from '../../domain/ordem-de-servico/value-objects/StatusOS';
import { UniqueID } from '../../domain/shared/UniqueID';
import { PrismaService } from '../database/prisma/prisma.service';

type PrismaOSCompleta = PrismaOS & {
  itensOrcamento: PrismaItemOrcamento[];
  execucoes: (PrismaExecucao & { pecasUtilizadas: PrismaPecaUtilizada[] })[];
};

@Injectable()
export class PrismaOrdemDeServicoRepository implements IOrdemDeServicoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: PrismaOSCompleta): OrdemDeServico {
    const itens = row.itensOrcamento.map((i) =>
      ItemOrcamento.restaurar(
        {
          tipo:
            i.tipo === PrismaTipoItemOrcamento.SERVICO
              ? TipoItemOrcamento.SERVICO
              : TipoItemOrcamento.PECA,
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
        servicoId: new UniqueID(e.servicoId),
        mecanicoId: new UniqueID(e.mecanicoId),
        inicio: e.inicio,
        fim: e.fim ?? undefined,
        observacoes: e.observacoes ?? undefined,
        pecasUtilizadas: e.pecasUtilizadas.map((p) => ({
          pecaInsumoId: new UniqueID(p.pecaInsumoId),
          quantidade: p.quantidade,
        })),
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

      await tx.itemOrcamento.deleteMany({ where: { ordemDeServicoId: osId } });
      if (os.itensOrcamento.length > 0) {
        await tx.itemOrcamento.createMany({
          data: os.itensOrcamento.map((i) => ({
            id: i.id.toValue(),
            ordemDeServicoId: osId,
            tipo:
              i.tipo === TipoItemOrcamento.SERVICO
                ? PrismaTipoItemOrcamento.SERVICO
                : PrismaTipoItemOrcamento.PECA,
            referenciaId: i.referenciaId.toValue(),
            descricao: i.descricao,
            quantidade: i.quantidade,
            valorUnitario: i.valorUnitario,
            valorTotal: i.valorTotal,
          })),
        });
      }

      for (const execucao of os.execucoes) {
        const execId = execucao.id.toValue();
        await tx.execucaoDeServico.upsert({
          where: { id: execId },
          create: {
            id: execId,
            ordemDeServicoId: osId,
            servicoId: execucao.servicoId.toValue(),
            mecanicoId: execucao.mecanicoId.toValue(),
            inicio: execucao.inicio,
            fim: execucao.fim ?? null,
            tempoExecucaoMinutos: execucao.tempoExecucaoMinutos ?? null,
            observacoes: execucao.observacoes ?? null,
          },
          update: {
            fim: execucao.fim ?? null,
            tempoExecucaoMinutos: execucao.tempoExecucaoMinutos ?? null,
            observacoes: execucao.observacoes ?? null,
          },
        });
        await tx.pecaUtilizada.deleteMany({ where: { execucaoDeServicoId: execId } });
        if (execucao.pecasUtilizadas.length > 0) {
          await tx.pecaUtilizada.createMany({
            data: execucao.pecasUtilizadas.map((p) => ({
              execucaoDeServicoId: execId,
              pecaInsumoId: p.pecaInsumoId.toValue(),
              quantidade: p.quantidade,
            })),
          });
        }
      }
    });
  }

  async buscarPorId(id: UniqueID): Promise<OrdemDeServico | null> {
    const row = await this.prisma.ordemDeServico.findUnique({
      where: { id: id.toValue() },
      include: {
        itensOrcamento: true,
        execucoes: { include: { pecasUtilizadas: true } },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async buscarPorNumero(numero: number): Promise<OrdemDeServico | null> {
    const row = await this.prisma.ordemDeServico.findUnique({
      where: { numero },
      include: {
        itensOrcamento: true,
        execucoes: { include: { pecasUtilizadas: true } },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async listar(): Promise<OrdemDeServico[]> {
    const rows = await this.prisma.ordemDeServico.findMany({
      include: {
        itensOrcamento: true,
        execucoes: { include: { pecasUtilizadas: true } },
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
      where: { tempoExecucaoMinutos: { not: null } },
    });
    return Math.round(result._avg.tempoExecucaoMinutos ?? 0);
  }
}
