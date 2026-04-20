import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { IClienteRepository } from '../../../domain/cliente/repositories/IClienteRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { NovoVeiculoInput, Veiculo } from '../../../domain/veiculo/entities/Veiculo';
import { IVeiculoRepository } from '../../../domain/veiculo/repositories/IVeiculoRepository';

@Injectable()
export class CadastrarVeiculoUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.VEICULO_REPOSITORY)
    private readonly veiculoRepository: IVeiculoRepository,
    @Inject(INJECTION_TOKENS.CLIENTE_REPOSITORY)
    private readonly clienteRepository: IClienteRepository,
  ) {}

  async execute(input: NovoVeiculoInput): Promise<Veiculo> {
    const cliente = await this.clienteRepository.buscarPorId(new UniqueID(input.clienteId));
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    const veiculo = Veiculo.criar(input);
    const existente = await this.veiculoRepository.buscarPorPlaca(veiculo.placa.value);
    if (existente) {
      throw new ConflictException('Já existe veículo cadastrado com esta placa');
    }
    await this.veiculoRepository.salvar(veiculo);
    return veiculo;
  }
}
