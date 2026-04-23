import { NotFoundException } from '@nestjs/common';

import { Cliente, TipoCliente } from '../../../domain/cliente/entities/Cliente';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { Veiculo } from '../../../domain/veiculo/entities/Veiculo';
import { IVeiculoRepository } from '../../../domain/veiculo/repositories/IVeiculoRepository';
import { CriarOSUseCase } from './CriarOSUseCase';

class InMemoryClienteRepository implements IClienteRepository {
  constructor(private readonly clientes: Cliente[]) {}
  async salvar(): Promise<void> {}
  async buscarPorId(id: UniqueID): Promise<Cliente | null> {
    return this.clientes.find((c) => c.id.equals(id)) ?? null;
  }
  async buscarPorDocumento(): Promise<Cliente | null> {
    return null;
  }
  async listar(): Promise<Cliente[]> {
    return this.clientes;
  }
  async remover(): Promise<void> {}
}

class InMemoryVeiculoRepository implements IVeiculoRepository {
  constructor(private readonly veiculos: Veiculo[]) {}
  async salvar(): Promise<void> {}
  async buscarPorId(id: UniqueID): Promise<Veiculo | null> {
    return this.veiculos.find((v) => v.id.equals(id)) ?? null;
  }
  async buscarPorPlaca(): Promise<Veiculo | null> {
    return null;
  }
  async listar(): Promise<Veiculo[]> {
    return this.veiculos;
  }
  async listarPorCliente(): Promise<Veiculo[]> {
    return this.veiculos;
  }
  async remover(): Promise<void> {}
}

class InMemoryOSRepository implements IOrdemDeServicoRepository {
  public oss: OrdemDeServico[] = [];
  async salvar(os: OrdemDeServico): Promise<void> {
    this.oss.push(os);
  }
  async buscarPorId(id: UniqueID): Promise<OrdemDeServico | null> {
    return this.oss.find((o) => o.id.equals(id)) ?? null;
  }
  async buscarPorNumero(numero: number): Promise<OrdemDeServico | null> {
    return this.oss.find((o) => o.numero.value === numero) ?? null;
  }
  async listar(): Promise<OrdemDeServico[]> {
    return this.oss;
  }
  async proximoNumero(): Promise<number> {
    return this.oss.length + 1;
  }
  async tempoMedioExecucaoMinutos(): Promise<number> {
    return 0;
  }
  async tempoMedioExecucaoPorServico(): Promise<[]> {
    return [];
  }
}

describe('CriarOSUseCase', () => {
  let cliente: Cliente;
  let veiculo: Veiculo;
  let useCase: CriarOSUseCase;
  let osRepo: InMemoryOSRepository;

  beforeEach(() => {
    cliente = Cliente.criar({
      tipo: TipoCliente.PF,
      documento: '52998224725',
      nome: 'Cliente Teste',
      email: 'cliente@teste.com',
    });
    veiculo = Veiculo.criar({
      placa: 'ABC1D23',
      marca: 'VW',
      modelo: 'Gol',
      ano: 2022,
      clienteId: cliente.id.toValue(),
    });
    osRepo = new InMemoryOSRepository();
    useCase = new CriarOSUseCase(
      osRepo,
      new InMemoryClienteRepository([cliente]),
      new InMemoryVeiculoRepository([veiculo]),
    );
  });

  it('cria OS com número sequencial e status RECEBIDA', async () => {
    const os = await useCase.execute({
      clienteId: cliente.id.toValue(),
      veiculoId: veiculo.id.toValue(),
    });
    expect(os.numero.value).toBe(1);
    expect(os.status.value).toBe('RECEBIDA');
    expect(osRepo.oss).toHaveLength(1);
  });

  it('falha se cliente não existir', async () => {
    await expect(
      useCase.execute({
        clienteId: '00000000-0000-0000-0000-000000000000',
        veiculoId: veiculo.id.toValue(),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
