import { Injectable } from '@nestjs/common';
import {
  Insumo as PrismaInsumo,
  TipoInsumo as PrismaTipoInsumo,
} from '@prisma/client';

import { Insumo, TipoInsumo } from '../../domain/insumo/entities/Insumo';
import { IInsumoRepository } from '../../domain/insumo/repositories/IInsumoRepository';
import { CodigoPeca } from '../../domain/insumo/value-objects/CodigoPeca';
import { Estoque } from '../../domain/insumo/value-objects/Estoque';
import { ValorUnitario } from '../../domain/insumo/value-objects/ValorUnitario';
import { UniqueID } from '../../domain/shared/UniqueID';
import { PrismaService } from '../database/prisma/prisma.service';
import { EventDispatcher } from '../events/EventDispatcher';

@Injectable()
export class PrismaInsumoRepository implements IInsumoRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  private toDomain(row: PrismaInsumo): Insumo {
    const tipo =
      row.tipo === PrismaTipoInsumo.PECA ? TipoInsumo.PECA : TipoInsumo.INSUMO;
    return Insumo.restaurar(
      {
        codigo: CodigoPeca.create(row.codigo),
        nome: row.nome,
        tipo,
        valorUnitario: ValorUnitario.create(Number(row.valorUnitario)),
        estoque: Estoque.create(
          row.quantidadeEstoque,
          row.estoqueMinimo,
          row.quantidadeReservada,
        ),
        criadoEm: row.criadoEm,
        atualizadoEm: row.atualizadoEm,
      },
      new UniqueID(row.id),
    );
  }

  async salvar(insumo: Insumo): Promise<void> {
    const data = {
      codigo: insumo.codigo.value,
      nome: insumo.nome,
      tipo:
        insumo.tipo === TipoInsumo.PECA
          ? PrismaTipoInsumo.PECA
          : PrismaTipoInsumo.INSUMO,
      valorUnitario: insumo.valorUnitario.value,
      quantidadeEstoque: insumo.estoque.quantidade,
      estoqueMinimo: insumo.estoque.minimo,
      quantidadeReservada: insumo.estoque.quantidadeReservada,
    };
    await this.prisma.insumo.upsert({
      where: { id: insumo.id.toValue() },
      create: { id: insumo.id.toValue(), ...data },
      update: data,
    });
    await this.eventDispatcher.publish(insumo.pullEvents());
  }

  async buscarPorId(id: UniqueID): Promise<Insumo | null> {
    const row = await this.prisma.insumo.findUnique({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  async buscarPorCodigo(codigo: string): Promise<Insumo | null> {
    const row = await this.prisma.insumo.findUnique({
      where: { codigo: codigo.toUpperCase() },
    });
    return row ? this.toDomain(row) : null;
  }

  async listar(): Promise<Insumo[]> {
    const rows = await this.prisma.insumo.findMany({ orderBy: { nome: 'asc' } });
    return rows.map((r) => this.toDomain(r));
  }

}
