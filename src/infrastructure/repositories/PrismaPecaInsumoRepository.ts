import { Injectable } from '@nestjs/common';
import {
  PecaInsumo as PrismaPecaInsumo,
  TipoPecaInsumo as PrismaTipoPecaInsumo,
} from '@prisma/client';

import { PecaInsumo, TipoPecaInsumo } from '../../domain/peca-insumo/entities/PecaInsumo';
import { IPecaInsumoRepository } from '../../domain/peca-insumo/repositories/IPecaInsumoRepository';
import { CodigoPeca } from '../../domain/peca-insumo/value-objects/CodigoPeca';
import { Estoque } from '../../domain/peca-insumo/value-objects/Estoque';
import { ValorUnitario } from '../../domain/peca-insumo/value-objects/ValorUnitario';
import { UniqueID } from '../../domain/shared/UniqueID';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class PrismaPecaInsumoRepository implements IPecaInsumoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: PrismaPecaInsumo): PecaInsumo {
    const tipo =
      row.tipo === PrismaTipoPecaInsumo.PECA ? TipoPecaInsumo.PECA : TipoPecaInsumo.INSUMO;
    return PecaInsumo.restaurar(
      {
        codigo: CodigoPeca.create(row.codigo),
        nome: row.nome,
        tipo,
        valorUnitario: ValorUnitario.create(Number(row.valorUnitario)),
        estoque: Estoque.create(row.quantidadeEstoque, row.estoqueMinimo),
        criadoEm: row.criadoEm,
        atualizadoEm: row.atualizadoEm,
      },
      new UniqueID(row.id),
    );
  }

  async salvar(peca: PecaInsumo): Promise<void> {
    const data = {
      codigo: peca.codigo.value,
      nome: peca.nome,
      tipo:
        peca.tipo === TipoPecaInsumo.PECA
          ? PrismaTipoPecaInsumo.PECA
          : PrismaTipoPecaInsumo.INSUMO,
      valorUnitario: peca.valorUnitario.value,
      quantidadeEstoque: peca.estoque.quantidade,
      estoqueMinimo: peca.estoque.minimo,
    };
    await this.prisma.pecaInsumo.upsert({
      where: { id: peca.id.toValue() },
      create: { id: peca.id.toValue(), ...data },
      update: data,
    });
  }

  async buscarPorId(id: UniqueID): Promise<PecaInsumo | null> {
    const row = await this.prisma.pecaInsumo.findUnique({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  async buscarPorCodigo(codigo: string): Promise<PecaInsumo | null> {
    const row = await this.prisma.pecaInsumo.findUnique({
      where: { codigo: codigo.toUpperCase() },
    });
    return row ? this.toDomain(row) : null;
  }

  async listar(): Promise<PecaInsumo[]> {
    const rows = await this.prisma.pecaInsumo.findMany({ orderBy: { nome: 'asc' } });
    return rows.map((r) => this.toDomain(r));
  }

  async remover(id: UniqueID): Promise<void> {
    await this.prisma.pecaInsumo.delete({ where: { id: id.toValue() } });
  }
}
