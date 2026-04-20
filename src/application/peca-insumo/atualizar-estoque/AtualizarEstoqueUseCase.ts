import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { PecaInsumo } from '../../../domain/peca-insumo/entities/PecaInsumo';
import { IPecaInsumoRepository } from '../../../domain/peca-insumo/repositories/IPecaInsumoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

interface AtualizarEstoqueInput {
  id: string;
  quantidade: number;
  minimo?: number;
}

@Injectable()
export class AtualizarEstoqueUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PECA_INSUMO_REPOSITORY)
    private readonly pecaRepository: IPecaInsumoRepository,
  ) {}

  async execute(input: AtualizarEstoqueInput): Promise<PecaInsumo> {
    const peca = await this.pecaRepository.buscarPorId(new UniqueID(input.id));
    if (!peca) throw new NotFoundException('Peça/insumo não encontrado');
    peca.atualizarEstoque(input.quantidade, input.minimo);
    await this.pecaRepository.salvar(peca);
    return peca;
  }
}
