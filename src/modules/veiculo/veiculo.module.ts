import { Module } from '@nestjs/common';

import { AtualizarVeiculoUseCase } from '../../application/veiculo/atualizar-veiculo/AtualizarVeiculoUseCase';
import { BuscarVeiculoUseCase } from '../../application/veiculo/buscar-veiculo/BuscarVeiculoUseCase';
import { CadastrarVeiculoUseCase } from '../../application/veiculo/cadastrar-veiculo/CadastrarVeiculoUseCase';
import { ListarVeiculosUseCase } from '../../application/veiculo/listar-veiculos/ListarVeiculosUseCase';
import { RemoverVeiculoUseCase } from '../../application/veiculo/remover-veiculo/RemoverVeiculoUseCase';
import { VeiculoController } from './veiculo.controller';

@Module({
  controllers: [VeiculoController],
  providers: [
    CadastrarVeiculoUseCase,
    BuscarVeiculoUseCase,
    ListarVeiculosUseCase,
    AtualizarVeiculoUseCase,
    RemoverVeiculoUseCase,
  ],
})
export class VeiculoModule {}
