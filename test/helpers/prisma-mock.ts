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
          ativo: true,
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
        if (where.cpfCnpj) return clientes.find((c) => c.cpfCnpj === where.cpfCnpj) ?? null;
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
          cpfCnpj: create.cpfCnpj,
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
      findUnique: async () => null,
      findMany: async () => [],
      upsert: async ({ create }: any) => create,
      delete: async () => ({}),
    },
    pecaInsumo: {
      findUnique: async () => null,
      findMany: async () => [],
      upsert: async ({ create }: any) => create,
      delete: async () => ({}),
    },
    ordemDeServico: {
      findUnique: async ({ where, include }: any) => {
        const found = where.id
          ? oss.find((o) => o.id === where.id)
          : oss.find((o) => o.numero === where.numero);
        if (!found) return null;
        if (include) {
          return {
            ...found,
            itensOrcamento: itensOrcamento.filter((i) => i.ordemDeServicoId === found.id),
            execucoes: execucoes
              .filter((e) => e.ordemDeServicoId === found.id)
              .map((e) => ({ ...e, pecasUtilizadas: [] })),
          };
        }
        return found;
      },
      findFirst: async () => {
        const sorted = [...oss].sort((a, b) => b.numero - a.numero);
        return sorted[0] ?? null;
      },
      findMany: async () =>
        oss.map((o) => ({
          ...o,
          itensOrcamento: itensOrcamento.filter((i) => i.ordemDeServicoId === o.id),
          execucoes: execucoes
            .filter((e) => e.ordemDeServicoId === o.id)
            .map((e) => ({ ...e, pecasUtilizadas: [] })),
        })),
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
        for (let i = itensOrcamento.length - 1; i >= 0; i--) {
          if (itensOrcamento[i].ordemDeServicoId === where.ordemDeServicoId) {
            itensOrcamento.splice(i, 1);
          }
        }
        return { count: 0 };
      },
      createMany: async ({ data }: any) => {
        for (const d of data) itensOrcamento.push({ ...d, criadoEm: new Date() });
        return { count: data.length };
      },
    },
    execucaoDeServico: {
      upsert: async ({ where, create }: any) => {
        const idx = execucoes.findIndex((e) => e.id === where.id);
        if (idx < 0) execucoes.push(create);
        return create;
      },
      aggregate: async () => ({ _avg: { tempoExecucaoMinutos: 0 } }),
    },
    pecaUtilizada: {
      deleteMany: async () => ({ count: 0 }),
      createMany: async ({ data }: any) => ({ count: data.length }),
    },
  };

  mock.$transaction = async (fn: any) => {
    if (typeof fn === 'function') return fn(mock);
    return Promise.all(fn);
  };

  return mock;
}
