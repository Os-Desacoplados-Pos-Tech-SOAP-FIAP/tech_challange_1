import { PerfilAcesso, StatusOS, TipoCliente } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface UsuarioMock {
  id: string;
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilAcesso;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export function createPrismaMock() {
  const usuarios: UsuarioMock[] = [];
  const clientes: any[] = [];
  const veiculos: any[] = [];
  const oss: any[] = [];
  const itensOrcamento: any[] = [];
  const execucoes: any[] = [];
  const orcamentoTokens: any[] = [];
  const servicos: any[] = [];
  const insumos: any[] = [];

  const expandOS = (o: any) => ({
    ...o,
    itensOrcamento: itensOrcamento.filter((i) => i.ordemDeServicoId === o.id),
    execucoes: execucoes.filter((e) => e.ordemDeServicoId === o.id),
  });

  const mock: any = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    usuario: {
      count: async () => usuarios.length,
      findUnique: async ({ where }: any) => {
        if (where.email) return usuarios.find((u) => u.email === where.email) ?? null;
        if (where.id) return usuarios.find((u) => u.id === where.id) ?? null;
        return null;
      },
      create: async ({ data }: any) => {
        const usuario: UsuarioMock = {
          id: data.id ?? randomUUID(),
          nome: data.nome,
          email: data.email,
          senha: data.senha,
          perfil: data.perfil,
          ativo: data.ativo ?? true,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        usuarios.push(usuario);
        return usuario;
      },
      upsert: async ({ where, create, update }: any) => {
        const idx = usuarios.findIndex((u) => u.id === where.id);
        if (idx >= 0) {
          usuarios[idx] = { ...usuarios[idx], ...update, atualizadoEm: new Date() };
          return usuarios[idx];
        }
        const usuario: UsuarioMock = {
          id: create.id ?? randomUUID(),
          nome: create.nome,
          email: create.email,
          senha: create.senha,
          perfil: create.perfil,
          ativo: create.ativo ?? true,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        usuarios.push(usuario);
        return usuario;
      },
    },
    cliente: {
      findUnique: async ({ where }: any) => {
        if (where.id) return clientes.find((c) => c.id === where.id) ?? null;
        if (where.documento) return clientes.find((c) => c.documento === where.documento) ?? null;
        return null;
      },
      findMany: async () => clientes,
      upsert: async ({ where, create, update }: any) => {
        const idx = clientes.findIndex((c) => c.id === where.id);
        if (idx >= 0) {
          clientes[idx] = { ...clientes[idx], ...update, atualizadoEm: new Date() };
          return clientes[idx];
        }
        const c = {
          id: create.id,
          tipo: create.tipo as TipoCliente,
          documento: create.documento,
          nome: create.nome,
          email: create.email,
          telefone: create.telefone ?? null,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        clientes.push(c);
        return c;
      },
      delete: async ({ where }: any) => {
        const idx = clientes.findIndex((c) => c.id === where.id);
        if (idx >= 0) clientes.splice(idx, 1);
        return {};
      },
    },
    veiculo: {
      findUnique: async ({ where }: any) => {
        if (where.id) return veiculos.find((v) => v.id === where.id) ?? null;
        if (where.placa) return veiculos.find((v) => v.placa === where.placa) ?? null;
        return null;
      },
      findMany: async ({ where }: any = {}) => {
        if (where?.clienteId) return veiculos.filter((v) => v.clienteId === where.clienteId);
        return veiculos;
      },
      upsert: async ({ where, create, update }: any) => {
        const idx = veiculos.findIndex((v) => v.id === where.id);
        if (idx >= 0) {
          veiculos[idx] = { ...veiculos[idx], ...update, atualizadoEm: new Date() };
          return veiculos[idx];
        }
        const v = {
          id: create.id,
          placa: create.placa,
          marca: create.marca,
          modelo: create.modelo,
          ano: create.ano,
          clienteId: create.clienteId,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        veiculos.push(v);
        return v;
      },
      delete: async ({ where }: any) => {
        const idx = veiculos.findIndex((v) => v.id === where.id);
        if (idx >= 0) veiculos.splice(idx, 1);
        return {};
      },
    },
    servico: {
      findUnique: async ({ where }: any) => {
        if (where?.id) return servicos.find((s) => s.id === where.id) ?? null;
        return null;
      },
      findMany: async () => [...servicos],
      upsert: async ({ where, create, update }: any) => {
        const idx = servicos.findIndex((s) => s.id === where.id);
        if (idx >= 0) {
          servicos[idx] = { ...servicos[idx], ...update, atualizadoEm: new Date() };
          return servicos[idx];
        }
        const s = {
          id: create.id,
          nome: create.nome,
          descricao: create.descricao ?? '',
          valorPadrao: create.valorPadrao,
          ativo: create.ativo ?? true,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        servicos.push(s);
        return s;
      },
      delete: async ({ where }: any) => {
        const idx = servicos.findIndex((s) => s.id === where.id);
        if (idx >= 0) servicos.splice(idx, 1);
        return {};
      },
    },
    insumo: {
      findUnique: async ({ where }: any) => {
        if (where?.id) return insumos.find((i) => i.id === where.id) ?? null;
        if (where?.codigo) return insumos.find((i) => i.codigo === where.codigo) ?? null;
        return null;
      },
      findMany: async () => [...insumos],
      upsert: async ({ where, create, update }: any) => {
        const idx = insumos.findIndex((i) => i.id === where.id);
        if (idx >= 0) {
          insumos[idx] = { ...insumos[idx], ...update, atualizadoEm: new Date() };
          return insumos[idx];
        }
        const ins = {
          id: create.id,
          codigo: create.codigo,
          nome: create.nome,
          tipo: create.tipo,
          valorUnitario: create.valorUnitario,
          quantidadeEstoque: create.quantidadeEstoque,
          quantidadeReservada: create.quantidadeReservada ?? 0,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        insumos.push(ins);
        return ins;
      },
      delete: async ({ where }: any) => {
        const idx = insumos.findIndex((i) => i.id === where.id);
        if (idx >= 0) insumos.splice(idx, 1);
        return {};
      },
    },
    ordemDeServico: {
      findUnique: async ({ where, include }: any) => {
        const found = where.id
          ? oss.find((o) => o.id === where.id)
          : oss.find((o) => o.numero === where.numero);
        if (!found) return null;
        return include ? expandOS(found) : found;
      },
      findFirst: async ({ where, include, orderBy, select }: any = {}) => {
        let candidates = [...oss];
        if (where?.itensOrcamento?.some?.id) {
          const itemId = where.itensOrcamento.some.id;
          candidates = candidates.filter((o) =>
            itensOrcamento.some((i) => i.ordemDeServicoId === o.id && i.id === itemId),
          );
        }
        if (orderBy?.numero === 'desc') {
          candidates.sort((a, b) => b.numero - a.numero);
        }
        const found = candidates[0];
        if (!found) return null;
        if (select) {
          const projected: any = {};
          for (const key of Object.keys(select)) projected[key] = (found as any)[key];
          return projected;
        }
        return include ? expandOS(found) : found;
      },
      findMany: async ({ include }: any = {}) => {
        return include ? oss.map((o) => expandOS(o)) : [...oss];
      },
      upsert: async ({ where, create, update }: any) => {
        const idx = oss.findIndex((o) => o.id === where.id);
        if (idx >= 0) {
          oss[idx] = { ...oss[idx], ...update, atualizadoEm: new Date() };
          return oss[idx];
        }
        const os = {
          id: create.id,
          numero: create.numero,
          clienteId: create.clienteId,
          veiculoId: create.veiculoId,
          status: create.status as StatusOS,
          valorEstimado: create.valorEstimado,
          observacoes: create.observacoes ?? null,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        oss.push(os);
        return os;
      },
    },
    itemOrcamento: {
      deleteMany: async ({ where }: any) => {
        let removed = 0;
        for (let i = itensOrcamento.length - 1; i >= 0; i--) {
          const item = itensOrcamento[i];
          if (item.ordemDeServicoId !== where.ordemDeServicoId) continue;
          if (where.id?.notIn && where.id.notIn.includes(item.id)) continue;
          itensOrcamento.splice(i, 1);
          removed += 1;
        }
        return { count: removed };
      },
      upsert: async ({ where, create, update }: any) => {
        const idx = itensOrcamento.findIndex((i) => i.id === where.id);
        if (idx >= 0) {
          itensOrcamento[idx] = { ...itensOrcamento[idx], ...update };
          return itensOrcamento[idx];
        }
        const created = { ...create, criadoEm: new Date() };
        itensOrcamento.push(created);
        return created;
      },
    },
    execucaoDeServico: {
      upsert: async ({ where, create, update }: any) => {
        const idx = execucoes.findIndex((e) => e.id === where.id);
        if (idx >= 0) {
          execucoes[idx] = { ...execucoes[idx], ...update };
          return execucoes[idx];
        }
        const created = { ...create, criadoEm: new Date() };
        execucoes.push(created);
        return created;
      },
      aggregate: async () => ({ _avg: { tempoExecucaoMinutos: 0 } }),
      groupBy: async () => [],
    },
    orcamentoToken: {
      findUnique: async ({ where }: any) =>
        orcamentoTokens.find((t) => t.token === where.token || t.id === where.id) ?? null,
      // Usado pelos e2e para recuperar o token emitido pelo evento (em produção
      // o cliente o recebe por email). O repositório de produção nunca chama findFirst.
      findFirst: async ({ where }: any = {}) =>
        orcamentoTokens.find(
          (t) =>
            (where?.ordemDeServicoId === undefined ||
              t.ordemDeServicoId === where.ordemDeServicoId) &&
            (where?.token === undefined || t.token === where.token),
        ) ?? null,
      create: async ({ data }: any) => {
        const tk = { ...data, id: data.id ?? randomUUID(), criadoEm: new Date() };
        orcamentoTokens.push(tk);
        return tk;
      },
      update: async ({ where, data }: any) => {
        const idx = orcamentoTokens.findIndex((t) => t.id === where.id);
        if (idx >= 0) orcamentoTokens[idx] = { ...orcamentoTokens[idx], ...data };
        return orcamentoTokens[idx];
      },
    },
  };

  mock.$transaction = async (fn: any) => {
    if (typeof fn === 'function') return fn(mock);
    return Promise.all(fn);
  };

  return mock;
}
