import { Injectable } from '@nestjs/common';
import { Cliente as PrismaCliente, TipoCliente as PrismaTipoCliente } from '@prisma/client';

import { Cliente, TipoCliente } from '../../domain/cliente/entities/Cliente';
import { IClienteRepository } from '../../domain/cliente/repositories/IClienteRepository';
import { CNPJ } from '../../domain/cliente/value-objects/CNPJ';
import { CPF } from '../../domain/cliente/value-objects/CPF';
import { Email } from '../../domain/cliente/value-objects/Email';
import { Telefone } from '../../domain/cliente/value-objects/Telefone';
import { UniqueID } from '../../domain/shared/UniqueID';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class PrismaClienteRepository implements IClienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: PrismaCliente): Cliente {
    const tipo = row.tipo === PrismaTipoCliente.PF ? TipoCliente.PF : TipoCliente.PJ;
    return Cliente.restaurar(
      {
        tipo,
        cpfCnpj: tipo === TipoCliente.PF ? CPF.create(row.cpfCnpj) : CNPJ.create(row.cpfCnpj),
        nome: row.nome,
        email: Email.create(row.email),
        telefone: row.telefone ? Telefone.create(row.telefone) : undefined,
        criadoEm: row.criadoEm,
        atualizadoEm: row.atualizadoEm,
      },
      new UniqueID(row.id),
    );
  }

  async salvar(cliente: Cliente): Promise<void> {
    const data = {
      tipo: cliente.tipo === TipoCliente.PF ? PrismaTipoCliente.PF : PrismaTipoCliente.PJ,
      cpfCnpj: cliente.cpfCnpj.value,
      nome: cliente.nome,
      email: cliente.email.value,
      telefone: cliente.telefone?.value ?? null,
    };
    await this.prisma.cliente.upsert({
      where: { id: cliente.id.toValue() },
      create: { id: cliente.id.toValue(), ...data },
      update: data,
    });
  }

  async buscarPorId(id: UniqueID): Promise<Cliente | null> {
    const row = await this.prisma.cliente.findUnique({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  async buscarPorDocumento(cpfCnpj: string): Promise<Cliente | null> {
    const cleaned = cpfCnpj.replace(/\D/g, '');
    const row = await this.prisma.cliente.findUnique({ where: { cpfCnpj: cleaned } });
    return row ? this.toDomain(row) : null;
  }

  async listar(): Promise<Cliente[]> {
    const rows = await this.prisma.cliente.findMany({ orderBy: { criadoEm: 'desc' } });
    return rows.map((r) => this.toDomain(r));
  }

  async remover(id: UniqueID): Promise<void> {
    await this.prisma.cliente.delete({ where: { id: id.toValue() } });
  }
}
