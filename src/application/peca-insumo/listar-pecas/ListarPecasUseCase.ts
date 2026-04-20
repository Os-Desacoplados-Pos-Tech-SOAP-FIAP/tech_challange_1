import { Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { PecaInsumo } from '../../../domain/peca-insumo/entities/PecaInsumo';
import { IPecaInsumoRepository } from '../../../domain/peca-insumo/repositories/IPecaInsumoRepository';

@Injectable()
export class ListarPecasUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PECA_INSUMO_REPOSITORY)
    private readonly pecaRepository: IPecaInsumoRepository,
  ) {}

  async execute(): Promise<PecaInsumo[]> {
    return this.pecaRepository.listar();
  }
}
